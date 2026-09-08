-- BlokMate — invite-code/link and dropdown onboarding, replacing the
-- free-text "kurum kodu" (raw tenant UUID) resident signup field.
--
-- Hierarchy this enforces end-to-end: Site (tenants) -> Building
-- (buildings) -> Unit (units) -> Resident (users). No schema change to
-- that hierarchy itself — tenants/buildings/units/users already model it
-- (see 001_init_blokmate.sql); this migration only adds the plumbing for
-- a resident to land on one specific tenant/building/unit without ever
-- typing a site name or raw id.

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — invite_tokens: manager-issued invite codes/links
-- ---------------------------------------------------------------------------

create table if not exists invite_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  building_id uuid not null references buildings (id) on delete cascade,
  unit_id uuid references units (id) on delete set null,
  token text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  expires_at timestamptz,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_invite_tokens_tenant on invite_tokens (tenant_id);
create unique index if not exists idx_invite_tokens_token on invite_tokens (token);

alter table invite_tokens enable row level security;

-- Manager/staff of the tenant can list/manage their own invites.
drop policy if exists invite_tokens_select_manager on invite_tokens;
create policy invite_tokens_select_manager on invite_tokens
  for select using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'));

drop policy if exists invite_tokens_insert on invite_tokens;
create policy invite_tokens_insert on invite_tokens
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'));

drop policy if exists invite_tokens_update on invite_tokens;
create policy invite_tokens_update on invite_tokens
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'))
  with check (tenant_id = blokmate_jwt_tenant_id());

-- Anyone holding a live invite link can resolve its token to a
-- tenant/building/unit — this is intentional (the token itself is the
-- capability, same trust model as any invite link) and is what lets an
-- unauthenticated visitor's invite-acceptance page prefill the site
-- without them ever seeing a list of tenants. Expired/revoked tokens
-- fall outside this policy, so a stale link 404s instead of resolving.
drop policy if exists invite_tokens_select_public on invite_tokens;
create policy invite_tokens_select_public on invite_tokens
  for select to anon, authenticated
  using (status = 'active' and (expires_at is null or expires_at > now()));

-- ---------------------------------------------------------------------------
-- PART 2 — resident_signup_requests: pending manager approval
-- ---------------------------------------------------------------------------
-- A resident never lands directly in `users` from self-signup (invite or
-- dropdown) — they land here first. `public.users` has no tenant_id/role
-- claim requirement problem to solve for this table (unlike `users`
-- itself, see app/api/blokmate/register/route.ts's header comment)
-- because nothing sensitive is granted by a row existing here: it's
-- inert until a manager reviews it and performs the real, RLS-guarded
-- `users` insert (users_insert already requires blokmate_jwt_role() =
-- 'manager', migration 002 — unchanged by this migration).

create table if not exists resident_signup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  tenant_id uuid not null references tenants (id) on delete cascade,
  building_id uuid not null references buildings (id) on delete cascade,
  unit_id uuid references units (id) on delete set null,
  invite_token_id uuid references invite_tokens (id) on delete set null,
  full_name text not null,
  phone text,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_resident_signup_requests_tenant on resident_signup_requests (tenant_id, status);

alter table resident_signup_requests enable row level security;

-- A brand-new auth user (from either onboarding mode) has a real session
-- (auth.uid() works) but no tenant_id/blokmate_role claim yet — this
-- insert is intentionally NOT gated on those claims, only on inserting
-- their own request. tenant/building/unit correctness isn't a privilege
-- boundary here (see table comment above): a bogus combination just
-- means no manager will ever see it, since manager_select below is
-- tenant-scoped.
drop policy if exists resident_signup_requests_insert_self on resident_signup_requests;
create policy resident_signup_requests_insert_self on resident_signup_requests
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- The requester can check their own request's status (for an "awaiting
-- approval" screen) even though they have no tenant claim yet.
drop policy if exists resident_signup_requests_select_self on resident_signup_requests;
create policy resident_signup_requests_select_self on resident_signup_requests
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists resident_signup_requests_select_manager on resident_signup_requests;
create policy resident_signup_requests_select_manager on resident_signup_requests
  for select using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'));

drop policy if exists resident_signup_requests_update_manager on resident_signup_requests;
create policy resident_signup_requests_update_manager on resident_signup_requests
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() in ('manager', 'staff'))
  with check (tenant_id = blokmate_jwt_tenant_id());

-- ---------------------------------------------------------------------------
-- PART 3 — public directory views, for the dropdown onboarding mode
-- ---------------------------------------------------------------------------
-- tenants_select/buildings_select/units_select (migrations 002/007) all
-- require a tenant_id JWT claim a brand-new signup doesn't have — so a
-- resident picking their Site/Building/Unit from dropdowns needs a
-- narrow, name-only public read path that doesn't exist on the base
-- tables. These views expose only what a picker needs (id + display name
-- + parent id) — never contact_email, address, owner_name, or any other
-- column on the underlying tables.
--
-- Views default to running with their OWNER's privileges for RLS
-- purposes (not the querying role's) — created here as the migration
-- role (postgres, which bypasses RLS), so granting anon/authenticated
-- SELECT on the view exposes exactly these three columns per table and
-- nothing else, regardless of what RLS says about the base table.

create or replace view public_tenants as
  select id, name from tenants;
create or replace view public_buildings as
  select id, tenant_id, name from buildings;
create or replace view public_units as
  select id, building_id, label from units;

grant select on public_tenants to anon, authenticated;
grant select on public_buildings to anon, authenticated;
grant select on public_units to anon, authenticated;

commit;
