-- BlokMate — manual payment-entry sprint: a denormalized paid_at on
-- invoices (so ResidentDuesList/ManagerDuesTable can show "last payment
-- date" without joining payments), and a distinct 'door' payment method
-- so a manager's "Kapıdan ödeme" (door-to-door cash collection) isn't
-- conflated with "Elden ödeme" (cash handed over some other way) in
-- reporting — both are cash in hand, but the manager's own workflow
-- treats them as different collection channels.

begin;

alter table invoices add column if not exists paid_at timestamptz;

alter table payments drop constraint if exists payments_method_check;
alter table payments add constraint payments_method_check
  check (method in ('bank_transfer', 'card', 'cash', 'door', 'other'));

commit;
