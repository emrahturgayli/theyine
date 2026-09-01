-- BlokMate — apartment/building management MVP schema.
-- Run against a Supabase (Postgres) project: paste into the SQL Editor, or
-- `supabase db push` if you're using the Supabase CLI locally.
--
-- Multi-tenant: every table below tenants hangs off `tenant_id`. This
-- migration does NOT enable Row Level Security — do that before exposing
-- any of this to the browser via the anon/public key. The lead-intake API
-- route (app/api/blokmate/lead/route.ts) writes with the service_role key
-- from a trusted server context, so RLS isn't required for that path to
-- work, but it is required before any client-side Supabase queries touch
-- these tables.

create extension if not exists "pgcrypto";

-- One row per customer organization (a property management company).
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text not null check (sector in ('apartment', 'office', 'mixed', 'other')),
  website text,
  contact_email text not null,
  status text not null default 'lead' check (status in ('lead', 'trial', 'active', 'churned')),
  created_at timestamptz not null default now()
);

-- A physical building/site under a tenant.
create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  address text,
  unit_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- An individual apartment/office within a building.
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings (id) on delete cascade,
  label text not null, -- e.g. "3B", "Kat 2 Daire 5"
  owner_name text,
  created_at timestamptz not null default now()
);

-- People — building managers, unit owners/tenants, and BlokMate staff.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,
  unit_id uuid references units (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'resident' check (role in ('manager', 'resident', 'staff')),
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

-- A monthly/one-off charge issued to a unit.
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BGN',
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'overdue', 'void')),
  description text,
  created_at timestamptz not null default now()
);

-- A payment applied against an invoice (supports partial payments).
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  paid_at timestamptz not null default now(),
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'card', 'cash', 'other')),
  reference text
);

-- Building-wide notices from the manager to residents.
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings (id) on delete cascade,
  author_user_id uuid references users (id) on delete set null,
  title text not null,
  body text not null,
  published_at timestamptz not null default now()
);

-- Resident-reported issues (maintenance, complaints, etc.).
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings (id) on delete cascade,
  unit_id uuid references units (id) on delete set null,
  reported_by_user_id uuid references users (id) on delete set null,
  subject text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_buildings_tenant on buildings (tenant_id);
create index if not exists idx_units_building on units (building_id);
create index if not exists idx_users_tenant on users (tenant_id);
create index if not exists idx_invoices_unit on invoices (unit_id);
create index if not exists idx_invoices_status on invoices (status);
create index if not exists idx_payments_invoice on payments (invoice_id);
create index if not exists idx_announcements_building on announcements (building_id);
create index if not exists idx_tickets_building on tickets (building_id);
create index if not exists idx_tickets_status on tickets (status);
