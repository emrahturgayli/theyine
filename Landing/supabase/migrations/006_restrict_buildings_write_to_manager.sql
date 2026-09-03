-- BlokMate — close a real RLS gap found while building Edit/Delete for
-- buildings: 002_add_tenant_id_and_rls.sql's buildings_insert/update/delete
-- policies only checked tenant_id, with no role restriction — unlike
-- units/invoices/payments/announcements, which all correctly restrict
-- writes to manager/accountant (or manager/staff for announcements).
--
-- Practical effect of the gap: any authenticated tenant member — a
-- resident, not just a manager — could insert/update/delete a building
-- via a direct Supabase call, even though the UI only ever renders those
-- actions for managers. The UI was never the actual security boundary,
-- RLS was supposed to be, and this table's policy didn't match that.

drop policy if exists buildings_insert on buildings;
create policy buildings_insert on buildings
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));

drop policy if exists buildings_update on buildings;
create policy buildings_update on buildings
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'))
  with check (tenant_id = blokmate_jwt_tenant_id());

drop policy if exists buildings_delete on buildings;
create policy buildings_delete on buildings
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));
