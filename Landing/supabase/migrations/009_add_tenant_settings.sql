-- BlokMate Phase 4 — per-tenant settings (currency preference, display
-- name, manager contact info). One row per tenant; created lazily by the
-- settings page's first save rather than backfilled, since every existing
-- tenant already has sane implicit defaults (currency falls back to the
-- locale-driven formatter in lib/blokmate-currency.ts when no row exists).

begin;

create table if not exists tenant_settings (
  tenant_id uuid primary key references tenants (id) on delete cascade,
  currency text check (currency in ('TRY', 'EUR', 'BGN')),
  display_name text,
  contact_email text,
  contact_phone text,
  notify_email boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table tenant_settings enable row level security;

-- Read: any authenticated member of the tenant (residents need the
-- currency preference too, to format their own dashboard). Write:
-- manager only, per spec.
drop policy if exists tenant_settings_select on tenant_settings;
create policy tenant_settings_select on tenant_settings
  for select using (tenant_id = blokmate_jwt_tenant_id());

drop policy if exists tenant_settings_insert on tenant_settings;
create policy tenant_settings_insert on tenant_settings
  for insert with check (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() = 'manager');

drop policy if exists tenant_settings_update on tenant_settings;
create policy tenant_settings_update on tenant_settings
  for update using (tenant_id = blokmate_jwt_tenant_id() and blokmate_jwt_role() = 'manager')
  with check (tenant_id = blokmate_jwt_tenant_id());

commit;
