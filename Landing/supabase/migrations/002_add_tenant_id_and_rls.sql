-- BlokMate — multi-tenant hardening: denormalize tenant_id onto every
-- operational table, then enable Row Level Security everywhere.
--
-- Depends on 001_init_blokmate.sql. Idempotent where practical (guards on
-- column/policy existence) so it can be re-run safely against a project
-- that already has parts of this applied.
--
-- IMPORTANT — assumption this migration depends on:
--   RLS below assumes `public.users.id` equals the Supabase Auth user's
--   `auth.uid()` (i.e. when a BlokMate user is provisioned, insert into
--   `public.users` using the id returned by `auth.admin.createUser` /
--   `auth.signUp`, not a fresh `gen_random_uuid()`). 001's schema didn't
--   require this; it matters now because `blokmate_current_unit_id()`
--   below resolves "which unit does the calling resident belong to" by
--   looking up `public.users` via `auth.uid()`. If your provisioning flow
--   generates its own id instead, unit-level scoping for residents will
--   silently return no rows rather than erroring — check this first.

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — add tenant_id to every table that doesn't already carry it
-- ---------------------------------------------------------------------------

alter table units add column if not exists tenant_id uuid;
alter table invoices add column if not exists tenant_id uuid;
alter table payments add column if not exists tenant_id uuid;
alter table announcements add column if not exists tenant_id uuid;
alter table tickets add column if not exists tenant_id uuid;

-- Backfill, in dependency order (each step only needs the previous step's
-- result, so this must run top-to-bottom in a single transaction).

update units u
set tenant_id = b.tenant_id
from buildings b
where u.building_id = b.id
  and u.tenant_id is null;

update invoices i
set tenant_id = u.tenant_id
from units u
where i.unit_id = u.id
  and i.tenant_id is null;

update payments p
set tenant_id = i.tenant_id
from invoices i
where p.invoice_id = i.id
  and p.tenant_id is null;

update announcements a
set tenant_id = b.tenant_id
from buildings b
where a.building_id = b.id
  and a.tenant_id is null;

update tickets t
set tenant_id = b.tenant_id
from buildings b
where t.building_id = b.id
  and t.tenant_id is null;

-- Enforce NOT NULL only after backfill — a table with pre-existing rows
-- that failed to backfill (e.g. an orphaned unit with no matching
-- building) would otherwise abort this migration; if that happens, fix
-- the orphan first and re-run rather than relaxing this constraint.
alter table units alter column tenant_id set not null;
alter table invoices alter column tenant_id set not null;
alter table payments alter column tenant_id set not null;
alter table announcements alter column tenant_id set not null;
alter table tickets alter column tenant_id set not null;

-- Foreign keys, added as separate constraints (not inline) so this block
-- can be re-run without erroring on "column already exists" above.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'units_tenant_id_fkey') then
    alter table units add constraint units_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_tenant_id_fkey') then
    alter table invoices add constraint invoices_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_tenant_id_fkey') then
    alter table payments add constraint payments_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'announcements_tenant_id_fkey') then
    alter table announcements add constraint announcements_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tickets_tenant_id_fkey') then
    alter table tickets add constraint tickets_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete cascade;
  end if;
end $$;

create index if not exists idx_units_tenant on units (tenant_id);
create index if not exists idx_invoices_tenant on invoices (tenant_id);
create index if not exists idx_payments_tenant on payments (tenant_id);
create index if not exists idx_announcements_tenant on announcements (tenant_id);
create index if not exists idx_tickets_tenant on tickets (tenant_id);

-- ---------------------------------------------------------------------------
-- PART 2 — helper functions the policies below read from the JWT / session
-- ---------------------------------------------------------------------------

-- auth.jwt() ->> 'tenant_id' is text; every tenant_id column is uuid, so
-- every policy needs this cast. Centralized here instead of repeated
-- inline so there's exactly one place to fix if the claim shape changes.
create or replace function blokmate_jwt_tenant_id() returns uuid
language sql stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
$$;

create or replace function blokmate_jwt_role() returns text
language sql stable
as $$
  select auth.jwt() ->> 'role';
$$;

-- security definer: this deliberately bypasses RLS on `users` so the
-- policies below (which call this function) don't recurse into the
-- `users` policy while evaluating a `units`/`invoices`/`payments` policy.
-- Scope is intentionally narrow — it only ever returns the caller's own
-- unit_id, nothing else about `users` is exposed through it.
create or replace function blokmate_current_unit_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select unit_id from users where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- PART 3 — enable RLS + policies on every table
-- ---------------------------------------------------------------------------

alter table tenants enable row level security;
alter table buildings enable row level security;
alter table units enable row level security;
alter table users enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table announcements enable row level security;
alter table tickets enable row level security;

-- tenants: no tenant_id column on itself — `id` IS the tenant. Read-only
-- for authenticated users (a tenant's own row); writes only ever happen
-- via the service_role key (lead intake), which bypasses RLS entirely, so
-- no insert/update/delete policy is needed for the authenticated role.
drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants
  for select
  using (id = blokmate_jwt_tenant_id());

-- buildings: flat tenant scoping, all four operations, per Part 2's spec.
drop policy if exists buildings_select on buildings;
create policy buildings_select on buildings
  for select using (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists buildings_insert on buildings;
create policy buildings_insert on buildings
  for insert with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists buildings_update on buildings;
create policy buildings_update on buildings
  for update using (tenant_id = blokmate_jwt_tenant_id()) with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists buildings_delete on buildings;
create policy buildings_delete on buildings
  for delete using (tenant_id = blokmate_jwt_tenant_id());

-- users: flat tenant scoping. Write access restricted to managers — a
-- resident account has no business inserting/editing rows in this table
-- (that's provisioning, not day-to-day use).
drop policy if exists users_select on users;
create policy users_select on users
  for select using (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists users_insert on users;
create policy users_insert on users
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() = 'manager');
drop policy if exists users_update on users;
create policy users_update on users
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() = 'manager')
  with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists users_delete on users;
create policy users_delete on users
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() = 'manager');

-- units: tenant-scoped for everyone; SELECT additionally narrows to "own
-- unit only" for residents (managers/accountants/auditors see every unit
-- in the tenant). Writes restricted to manager/accountant.
drop policy if exists units_select on units;
create policy units_select on units
  for select using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant', 'auditor')
      or id = blokmate_current_unit_id()
    )
  );
drop policy if exists units_insert on units;
create policy units_insert on units
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));
drop policy if exists units_update on units;
create policy units_update on units
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'))
  with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists units_delete on units;
create policy units_delete on units
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));

-- invoices: same pattern as units — residents see only invoices for their
-- own unit; managers/accountants/auditors see every invoice in the tenant.
drop policy if exists invoices_select on invoices;
create policy invoices_select on invoices
  for select using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant', 'auditor')
      or unit_id = blokmate_current_unit_id()
    )
  );
drop policy if exists invoices_insert on invoices;
create policy invoices_insert on invoices
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));
drop policy if exists invoices_update on invoices;
create policy invoices_update on invoices
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'))
  with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists invoices_delete on invoices;
create policy invoices_delete on invoices
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));

-- payments: no unit_id column of its own — resident scoping goes through
-- invoices. Write access is effectively service_role-only in practice
-- (the payments webhook uses the service key, which bypasses RLS), so the
-- authenticated-role insert/update/delete policies here stay
-- manager/accountant-only rather than opening writes to residents.
drop policy if exists payments_select on payments;
create policy payments_select on payments
  for select using (
    tenant_id = blokmate_jwt_tenant_id()
    and (
      blokmate_jwt_role() in ('manager', 'accountant', 'auditor')
      or invoice_id in (select id from invoices where unit_id = blokmate_current_unit_id())
    )
  );
drop policy if exists payments_insert on payments;
create policy payments_insert on payments
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));
drop policy if exists payments_update on payments;
create policy payments_update on payments
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'))
  with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists payments_delete on payments;
create policy payments_delete on payments
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'accountant'));

-- announcements: every role in the tenant can read (residents need to see
-- notices); only manager/staff can write.
drop policy if exists announcements_select on announcements;
create policy announcements_select on announcements
  for select using (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists announcements_insert on announcements;
create policy announcements_insert on announcements
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'));
drop policy if exists announcements_update on announcements;
create policy announcements_update on announcements
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'))
  with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists announcements_delete on announcements;
create policy announcements_delete on announcements
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'));

-- tickets: residents can read/report their own building's tickets and
-- read the ones they filed; managers/staff see and manage every ticket
-- in the tenant. Kept permissive on SELECT (tenant-wide) since a shared
-- "open issues in my building" view is normal for residents too — tighten
-- to `reported_by_user_id = auth.uid()` instead if that's not desired.
drop policy if exists tickets_select on tickets;
create policy tickets_select on tickets
  for select using (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists tickets_insert on tickets;
create policy tickets_insert on tickets
  for insert with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists tickets_update on tickets;
create policy tickets_update on tickets
  for update using (
    tenant_id = blokmate_jwt_tenant_id()
    and (blokmate_jwt_role() in ('manager', 'staff') or reported_by_user_id = auth.uid())
  )
  with check (tenant_id = blokmate_jwt_tenant_id());
drop policy if exists tickets_delete on tickets;
create policy tickets_delete on tickets
  for delete using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'));

commit;

-- ---------------------------------------------------------------------------
-- PART 4 — custom access token hook (adds tenant_id/role to the JWT)
-- ---------------------------------------------------------------------------
--
-- RLS above reads auth.jwt() ->> 'tenant_id' / 'role'. Supabase does not
-- put arbitrary app columns into the JWT by default — you opt in with a
-- "Custom Access Token" Auth Hook, which is a Postgres function Supabase
-- calls right before minting each access token. The function below is
-- that hook. Defining it here does NOT activate it — Supabase Auth needs
-- to be told to call it, which is a project-level Auth setting, not a SQL
-- statement:
--
--   Supabase Studio → Authentication → Hooks → Custom Access Token →
--   select "public.custom_access_token_hook" → Enable.
--   (Or via the Management API / supabase/config.toml's
--   [auth.hook.custom_access_token] block if you manage config as code.)
--
-- Without that step, auth.jwt() ->> 'tenant_id' evaluates to null for
-- every user and every policy above denies all access — this is a
-- fail-closed default, not a bug, but it means RLS will look "broken"
-- (empty results everywhere) until this hook is switched on.
--
-- SUPERSEDED by 003_fix_role_claim_collision.sql: the version below
-- writes the app role into the JWT's "role" claim, which collides with
-- the reserved claim PostgREST uses to pick a Postgres role for the
-- request — enabling this exact function as written here would break
-- every authenticated request on the project, not just BlokMate's. Apply
-- 003 immediately after this file; do not enable the Auth Hook using the
-- function as defined in this block.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_tenant_id uuid;
  user_role text;
begin
  select tenant_id, role
    into user_tenant_id, user_role
    from public.users
    where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  if user_tenant_id is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
  end if;
  if user_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- The hook runs as the `supabase_auth_admin` role — it needs explicit
-- grants to read `public.users`, since RLS (enabled above) would
-- otherwise block it too.
grant usage on schema public to supabase_auth_admin;
grant select on public.users to supabase_auth_admin;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users_auth_hook_select'
  ) then
    create policy users_auth_hook_select on public.users
      for select
      to supabase_auth_admin
      using (true);
  end if;
end $$;
