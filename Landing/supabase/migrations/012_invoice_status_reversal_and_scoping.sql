-- BlokMate Phase 5.5 — manager invoice-status reversal, and closing a gap
-- 010_allow_resident_self_payment.sql's own header comment already flagged:
-- that migration's invoices_update policy let a resident set their own
-- unit's invoice to ANY status the CHECK constraint allows (e.g. flip
-- back to 'unpaid' after paying), because the `using`/`with check` only
-- checked tenant_id + unit ownership, not the actual status transition.
--
-- This migration:
--   1. Keeps manager/accountant fully unrestricted on invoices — they can
--      already flip paid -> unpaid today (their branch of the policy never
--      checked status), so "Ödenmedi Yap" needs no RLS change for them;
--      restated here explicitly so the intent isn't just tribal knowledge.
--   2. Restricts a resident's self-service transition to exactly
--      unpaid/overdue -> paid: the `using` clause (evaluated against the
--      OLD row) requires the existing status be unpaid/overdue, and the
--      `with check` (evaluated against the NEW row) requires the result be
--      'paid'. A resident can no longer un-pay their own invoice.

begin;

drop policy if exists invoices_update on invoices;
create policy invoices_update on invoices
  for update using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant')
      or (unit_id = blokmate_current_unit_id() and status in ('unpaid', 'overdue'))
    )
  )
  with check (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant')
      or (unit_id = blokmate_current_unit_id() and status = 'paid')
    )
  );

commit;
