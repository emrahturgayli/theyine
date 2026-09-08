-- BlokMate Phase 6 — real Stripe payments + SaaS plan groundwork.
--
-- Depends on 002 (RLS helpers), 009 (tenant_settings), 010/012 (the
-- resident self-payment RLS this migration now revokes).

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — tenant_settings: plan + Stripe customer id
-- ---------------------------------------------------------------------------

alter table tenant_settings add column if not exists plan text not null default 'starter'
  check (plan in ('starter', 'pro', 'enterprise'));
alter table tenant_settings add column if not exists stripe_customer_id text;

-- ---------------------------------------------------------------------------
-- PART 2 — payments: unique reference, for webhook idempotency
-- ---------------------------------------------------------------------------
-- Stripe retries a webhook delivery on timeout/non-2xx, and
-- checkout.session.completed + payment_intent.succeeded both fire for the
-- same charge (app/api/payments/webhook/route.ts handles both). This
-- index is what turns a duplicate delivery into a no-op instead of a
-- second payment row — the webhook catches the resulting unique-violation
-- (Postgres error code 23505) and treats it as already-processed.
--
-- Partial (where reference is not null) because pre-Stripe payment rows
-- (markInvoicePaid's manager quick-action, and any leftover mock-payment
-- rows from Phase 4) may share or lack a reference.
create unique index if not exists idx_payments_reference_unique on payments (reference) where reference is not null;

-- ---------------------------------------------------------------------------
-- PART 3 — revoke resident client-side payment writes
-- ---------------------------------------------------------------------------
-- 010_allow_resident_self_payment.sql (Phase 4's mock flow) let a resident
-- insert their own unit's payment row and flip their own invoice to paid
-- directly from the browser. Real payments now go through
-- app/api/payments/webhook/route.ts using the service_role key, which
-- bypasses RLS entirely — so that resident grant no longer serves the
-- mock flow it was added for, and leaving it in place would mean a
-- resident could still forge a "payment" by calling Supabase directly
-- from devtools, bypassing Stripe altogether. Both policies revert to
-- manager/accountant-only, matching every other financial write in this
-- schema (markInvoicePaid, deleteInvoice, etc).

drop policy if exists payments_insert on payments;
create policy payments_insert on payments
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));

drop policy if exists invoices_update on invoices;
create policy invoices_update on invoices
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'))
  with check (tenant_id = blokmate_jwt_tenant_id());

commit;
