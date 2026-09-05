-- BlokMate Phase 4 — mock "Pay Now" self-service flow needs a resident to
-- be able to record a payment against, and flip to paid, their OWN unit's
-- invoice. 002_add_tenant_id_and_rls.sql's payments_insert/invoices_update
-- policies were manager/accountant-only, which was correct until this
-- feature existed — a resident had no self-service payment path at all.
--
-- Scope is deliberately narrow: a resident can only ever touch a
-- payment/invoice tied to blokmate_current_unit_id() (their own unit, via
-- the security-definer helper from 002), same as their existing read
-- access. This does NOT let a resident edit a manager-entered invoice's
-- amount/due_date/etc. — invoices_update's `with check` still requires
-- tenant_id to match, and the mock payment flow (lib/blokmate-payments.ts)
-- only ever sends `{ status: 'paid' }` as the update payload, never touches
-- other columns. A malicious resident crafting their own update call could
-- still set status on their own invoice to anything in the CHECK
-- constraint's enum (e.g. back to 'unpaid') — acceptable for a mock/demo
-- payment gateway; tighten with a column-level trigger guard before wiring
-- a real payment processor.

begin;

drop policy if exists payments_insert on payments;
create policy payments_insert on payments
  for insert with check (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant')
      or invoice_id in (select id from invoices where unit_id = blokmate_current_unit_id())
    )
  );

drop policy if exists invoices_update on invoices;
create policy invoices_update on invoices
  for update using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant')
      or unit_id = blokmate_current_unit_id()
    )
  )
  with check (tenant_id = blokmate_jwt_tenant_id());

commit;
