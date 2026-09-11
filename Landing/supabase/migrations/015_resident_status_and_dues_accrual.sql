-- BlokMate — SPEC.md Section 6 (Ömer/beta feedback): resident occupancy
-- status (owner/tenant) and the groundwork for bulk monthly dues
-- accrual. Phone number needed NO migration — users.phone and
-- resident_signup_requests.phone already exist (001_init_blokmate.sql,
-- 014_onboarding_invites_and_directory.sql); that item is a pure
-- frontend/API gap (the register form's manager path never collects it,
-- and the manager-provisioning insert in app/api/blokmate/register/route.ts
-- never persists it), addressed in the follow-up frontend commit, not here.

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — resident occupancy status: Mülk Sahibi (owner) vs Kiracı (tenant)
-- ---------------------------------------------------------------------------
-- Lives on `users` (the actual provisioned resident) and mirrored on
-- resident_signup_requests (migration 014) so the choice made at signup
-- survives into the row a manager's approval creates — see
-- approveSignupRequest() in lib/blokmate-invites.ts, updated alongside
-- this migration to carry it through.

alter table users add column if not exists resident_status text
  check (resident_status in ('owner', 'tenant'));

alter table resident_signup_requests add column if not exists resident_status text
  check (resident_status in ('owner', 'tenant'));

-- ---------------------------------------------------------------------------
-- PART 2 — per-building standard dues amount
-- ---------------------------------------------------------------------------
-- What "Aylık Aidatları Tahakkuk Et" (bulk-accrue this month's dues to
-- every occupied unit) defaults its amount to. Nullable — a building
-- with no standard amount set just can't use the bulk action yet; the
-- manager can still create invoices one at a time as before.

alter table buildings add column if not exists standard_due_amount_cents integer
  check (standard_due_amount_cents >= 0);

-- ---------------------------------------------------------------------------
-- PART 3 — invoices.period + duplicate-accrual guard
-- ---------------------------------------------------------------------------
-- 'YYYY-MM' tag identifying which accrual run (if any) produced an
-- invoice. Nullable — a manually created one-off invoice (the existing
-- single-invoice form) has no period. The partial unique index is the
-- actual guardrail against a manager clicking "Tahakkuk Et" twice for
-- the same building/month: the second run's insert for an
-- already-invoiced unit fails on this constraint rather than silently
-- double-billing a resident. Scoped per unit (not per building) so a
-- unit added mid-month can still get its first invoice in a later,
-- otherwise-already-run period.

alter table invoices add column if not exists period text check (period ~ '^\d{4}-\d{2}$');

create unique index if not exists idx_invoices_unit_period on invoices (unit_id, period) where period is not null;

commit;
