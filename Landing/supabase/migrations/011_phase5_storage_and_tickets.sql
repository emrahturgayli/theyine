-- BlokMate Phase 5 — attachments (Storage), ticket categories, and the
-- groundwork columns the reminder cron / broadcast features read from.
--
-- Depends on 002 (blokmate_jwt_tenant_id/role), 007 (tickets, comments).

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — announcements/tickets: attachment + category columns
-- ---------------------------------------------------------------------------

alter table announcements add column if not exists attachment_url text;
alter table tickets add column if not exists attachment_url text;
alter table tickets add column if not exists category text not null default 'general'
  check (category in ('general', 'payment_notice'));

-- ---------------------------------------------------------------------------
-- PART 1b — notifications: free-text message + a broadcast type, for the
-- manager-initiated "Toplu Bildirim Gönder" feature (not fired by any
-- trigger — a direct manager action, so it needs its own insert policy).
-- ---------------------------------------------------------------------------

alter table notifications add column if not exists message text;

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in (
  'announcement_published', 'invoice_issued', 'ticket_updated', 'payment_completed',
  'reminder_due', 'broadcast_message'
));

drop policy if exists notifications_insert on notifications;
create policy notifications_insert on notifications
  for insert with check (
    tenant_id = blokmate_jwt_tenant_id()
    and blokmate_jwt_role() in ('manager', 'staff')
  );

-- ---------------------------------------------------------------------------
-- PART 2 — storage bucket + RLS
-- ---------------------------------------------------------------------------
-- Private bucket (public = false) — every read goes through a short-lived
-- signed URL (lib/blokmate-attachments.ts), not a permanent public link,
-- since these are residents' payment receipts and manager attachments.
--
-- Object path convention (enforced only by the app, not by a CHECK
-- constraint — Storage has no schema for object names): the caller's own
-- tenant_id as the first path segment, e.g.
--   {tenant_id}/announcements/{random-id}-{filename}
--   {tenant_id}/tickets/{random-id}-{filename}
-- Every policy below parses that first segment back out with split_part()
-- and compares it to the caller's JWT tenant_id — same pattern as every
-- table-level policy elsewhere in this schema, just applied to
-- storage.objects.name instead of a tenant_id column.

insert into storage.buckets (id, name, public)
values ('blokmate-attachments', 'blokmate-attachments', false)
on conflict (id) do nothing;

-- SELECT: any authenticated member of the tenant (managers and residents
-- both need to view attachments — a resident viewing a manager's
-- announcement attachment, or a manager viewing a resident's uploaded
-- receipt).
drop policy if exists blokmate_attachments_select on storage.objects;
create policy blokmate_attachments_select on storage.objects
  for select using (
    bucket_id = 'blokmate-attachments'
    and split_part(name, '/', 1)::uuid = blokmate_jwt_tenant_id()
  );

-- INSERT: managers/staff can upload anywhere under their tenant folder
-- (announcement attachments, etc).
drop policy if exists blokmate_attachments_manager_insert on storage.objects;
create policy blokmate_attachments_manager_insert on storage.objects
  for insert with check (
    bucket_id = 'blokmate-attachments'
    and split_part(name, '/', 1)::uuid = blokmate_jwt_tenant_id()
    and blokmate_jwt_role() in ('manager', 'staff')
  );

-- INSERT: a resident may upload only under their tenant's `tickets/`
-- subfolder (attaching a receipt/proof to a ticket they're filing). This
-- does NOT verify the object is tied to a ticket the resident actually
-- owns — that link is only made once the row's attachment_url is set,
-- which tickets_update RLS (migration 007) already restricts to
-- manager/staff or reported_by_user_id = auth.uid(). A resident could in
-- principle upload an orphaned file under this prefix that never gets
-- attached to a row; acceptable (no data exposure, just storage litter)
-- for this feature's scope.
drop policy if exists blokmate_attachments_resident_ticket_insert on storage.objects;
create policy blokmate_attachments_resident_ticket_insert on storage.objects
  for insert with check (
    bucket_id = 'blokmate-attachments'
    and split_part(name, '/', 1)::uuid = blokmate_jwt_tenant_id()
    and split_part(name, '/', 2) = 'tickets'
  );

-- DELETE: managers/staff only, per spec ("Resident'lar sadece select
-- yapabilir" for the general bucket policy).
drop policy if exists blokmate_attachments_manager_delete on storage.objects;
create policy blokmate_attachments_manager_delete on storage.objects
  for delete using (
    bucket_id = 'blokmate-attachments'
    and split_part(name, '/', 1)::uuid = blokmate_jwt_tenant_id()
    and blokmate_jwt_role() in ('manager', 'staff')
  );

commit;
