-- BlokMate Phase 4 — lightweight notification layer.
--
-- Depends on 002_add_tenant_id_and_rls.sql (blokmate_jwt_tenant_id(),
-- blokmate_current_unit_id()) and 007_add_comments_and_resident_scoping.sql
-- (blokmate_current_building_id(), comments table).
--
-- Design: rows are only ever written by the trigger functions below, never
-- directly by a client insert — there is deliberately no `notifications_insert`
-- policy for the authenticated role. The trigger functions are SECURITY
-- DEFINER, so they run as the function owner (the table-owning role in
-- Supabase, which isn't subject to RLS), letting them fan a single
-- announcement/invoice/ticket event out into one notification row per
-- recipient without needing an insert policy that some other client could
-- also exploit to spam arbitrary users.

begin;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  type text not null check (type in (
    'announcement_published', 'invoice_issued', 'ticket_updated', 'payment_completed'
  )),
  related_announcement_id uuid references announcements (id) on delete cascade,
  related_invoice_id uuid references invoices (id) on delete cascade,
  related_ticket_id uuid references tickets (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_id, is_read);
create index if not exists idx_notifications_tenant on notifications (tenant_id);

alter table notifications enable row level security;

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select using (tenant_id = blokmate_jwt_tenant_id() and user_id = auth.uid());

-- The only client-writable field is is_read — a recipient marking their
-- own notification read/unread. tenant_id/user_id/type etc. are never
-- meant to change after creation; the `with check` re-verifies ownership
-- rather than trusting the row wasn't reassigned to someone else mid-edit.
drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
  for update using (tenant_id = blokmate_jwt_tenant_id() and user_id = auth.uid())
  with check (tenant_id = blokmate_jwt_tenant_id() and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Trigger: announcement published -> notify every resident in that building
-- ---------------------------------------------------------------------------

create or replace function blokmate_notify_announcement_published() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into notifications (tenant_id, user_id, type, related_announcement_id)
  select new.tenant_id, u.id, 'announcement_published', new.id
  from users u
  join units un on un.id = u.unit_id
  where un.building_id = new.building_id
    and u.tenant_id = new.tenant_id;
  return new;
end;
$$;

drop trigger if exists trg_notify_announcement_published on announcements;
create trigger trg_notify_announcement_published
  after insert on announcements
  for each row execute function blokmate_notify_announcement_published();

-- ---------------------------------------------------------------------------
-- Trigger: invoice issued -> notify the unit's resident(s)
-- ---------------------------------------------------------------------------

create or replace function blokmate_notify_invoice_issued() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into notifications (tenant_id, user_id, type, related_invoice_id)
  select new.tenant_id, u.id, 'invoice_issued', new.id
  from users u
  where u.unit_id = new.unit_id
    and u.tenant_id = new.tenant_id;
  return new;
end;
$$;

drop trigger if exists trg_notify_invoice_issued on invoices;
create trigger trg_notify_invoice_issued
  after insert on invoices
  for each row execute function blokmate_notify_invoice_issued();

-- ---------------------------------------------------------------------------
-- Trigger: invoice paid -> notify the unit's resident(s) (payment_completed)
-- ---------------------------------------------------------------------------

create or replace function blokmate_notify_invoice_paid() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    insert into notifications (tenant_id, user_id, type, related_invoice_id)
    select new.tenant_id, u.id, 'payment_completed', new.id
    from users u
    where u.unit_id = new.unit_id
      and u.tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_invoice_paid on invoices;
create trigger trg_notify_invoice_paid
  after update on invoices
  for each row execute function blokmate_notify_invoice_paid();

-- ---------------------------------------------------------------------------
-- Trigger: ticket status change -> notify the reporter
-- ---------------------------------------------------------------------------

create or replace function blokmate_notify_ticket_updated() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.reported_by_user_id is not null and new.status is distinct from old.status then
    insert into notifications (tenant_id, user_id, type, related_ticket_id)
    values (new.tenant_id, new.reported_by_user_id, 'ticket_updated', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_ticket_updated on tickets;
create trigger trg_notify_ticket_updated
  after update on tickets
  for each row execute function blokmate_notify_ticket_updated();

-- ---------------------------------------------------------------------------
-- Trigger: new comment on a ticket -> notify the reporter (unless they're
-- the one commenting)
-- ---------------------------------------------------------------------------

create or replace function blokmate_notify_ticket_comment() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  reporter uuid;
begin
  if new.ticket_id is not null then
    select reported_by_user_id into reporter from tickets where id = new.ticket_id;
    if reporter is not null and reporter <> new.user_id then
      insert into notifications (tenant_id, user_id, type, related_ticket_id)
      values (new.tenant_id, reporter, 'ticket_updated', new.ticket_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_ticket_comment on comments;
create trigger trg_notify_ticket_comment
  after insert on comments
  for each row execute function blokmate_notify_ticket_comment();

commit;
