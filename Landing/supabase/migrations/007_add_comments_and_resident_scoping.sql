-- BlokMate Phase 3 — comment threads on announcements/tickets, plus
-- narrowing residents' announcement/ticket visibility from tenant-wide to
-- their own building (they already see all buildings' names via the
-- buildings table, but reading every other building's notices/tickets
-- was more than the "own building" scope this feature is meant to have).
--
-- Depends on 002_add_tenant_id_and_rls.sql (blokmate_jwt_tenant_id(),
-- blokmate_jwt_role(), blokmate_current_unit_id()).

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — resolve the calling resident's building_id
-- ---------------------------------------------------------------------------

-- security definer for the same reason blokmate_current_unit_id() is: it
-- bypasses RLS on units/users while resolving "which building is this
-- resident in", so policies that call it don't recurse into those tables'
-- own policies. Returns null for managers/staff/accountant/auditor (no
-- unit_id on their user row) and for a resident whose unit_id lookup
-- fails — either way, callers OR this with a role check so that's safe.
create or replace function blokmate_current_building_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select u.building_id
  from units u
  where u.id = blokmate_current_unit_id();
$$;

-- ---------------------------------------------------------------------------
-- PART 2 — narrow resident SELECT on announcements/tickets to own building
-- ---------------------------------------------------------------------------

drop policy if exists announcements_select on announcements;
create policy announcements_select on announcements
  for select using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'staff', 'accountant', 'auditor')
      or building_id = blokmate_current_building_id()
    )
  );

drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'staff', 'accountant', 'auditor')
      or building_id = blokmate_current_building_id()
      or reported_by_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- PART 3 — comments table
-- ---------------------------------------------------------------------------

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  building_id uuid not null references buildings (id) on delete cascade,
  announcement_id uuid references announcements (id) on delete cascade,
  ticket_id uuid references tickets (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now(),
  constraint comments_exactly_one_parent check (
    (announcement_id is not null and ticket_id is null)
    or (announcement_id is null and ticket_id is not null)
  )
);

create index if not exists idx_comments_tenant on comments (tenant_id);
create index if not exists idx_comments_announcement on comments (announcement_id);
create index if not exists idx_comments_ticket on comments (ticket_id);

alter table comments enable row level security;

-- SELECT: managers/staff/accountant/auditor see every comment in the
-- tenant; a resident sees comments on their own building's announcements
-- or on tickets they filed (mirrors tickets_select's "own building or own
-- ticket" scope above, since a ticket's building_id could differ from the
-- reader's own building if reassigned — reported_by_user_id is the
-- durable ownership check).
drop policy if exists comments_select on comments;
create policy comments_select on comments
  for select using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'staff', 'accountant', 'auditor')
      or building_id = blokmate_current_building_id()
      or ticket_id in (select id from tickets where reported_by_user_id = auth.uid())
    )
  );

-- INSERT: managers/staff can comment on anything in their tenant. A
-- resident can comment on an announcement in their own building, or on a
-- ticket they personally filed — not on someone else's ticket, even in
-- the same building, since a ticket may describe a private issue.
drop policy if exists comments_insert on comments;
create policy comments_insert on comments
  for insert with check (
    tenant_id = blokmate_jwt_tenant_id()
    and user_id = auth.uid()
    and (
      blokmate_jwt_role() in ('manager', 'staff')
      or (
        announcement_id is not null
        and building_id = blokmate_current_building_id()
        and building_id = (select building_id from announcements where id = announcement_id)
      )
      or (
        ticket_id is not null
        and ticket_id in (select id from tickets where reported_by_user_id = auth.uid())
      )
    )
  );

-- No update/delete policy for any role yet — comments are append-only for
-- now; add one later if edit/retract becomes a real requirement.

commit;
