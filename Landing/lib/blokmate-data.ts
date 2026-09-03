"use client";

import { getBlokmateSupabaseBrowser, getBlokmateSessionClaims } from "@/lib/blokmate-supabase-browser";

/**
 * Entity CRUD for the authenticated BlokMate dashboard pages. Every read
 * goes through the anon-key browser client — RLS (migrations 002/003) is
 * what actually scopes SELECTs to the caller's tenant (and, for
 * residents, their own unit); reads never pass or trust a tenant_id from
 * the client for that reason.
 *
 * Writes are different: every operational table's tenant_id column is
 * NOT NULL (migration 002), so an insert with no tenant_id in the payload
 * fails outright — RLS's `with check` never even gets a chance to run,
 * Postgres rejects it at the NOT NULL constraint first. requireTenantId()
 * below reads the caller's tenant_id off their JWT claims (via
 * getBlokmateSessionClaims — populated by the Custom Access Token hook
 * from public.users.tenant_id, see supabase/migrations/003_fix_role_claim_collision.sql)
 * and every create* function includes it explicitly. This is NOT a
 * security boundary — a malicious client could still pass a fabricated
 * tenant_id, and RLS's `with check (tenant_id = blokmate_jwt_tenant_id())`
 * is what actually rejects that. It exists purely so a legitimate,
 * correctly-scoped insert doesn't fail the NOT NULL check before RLS is
 * even consulted.
 */

async function requireTenantId(): Promise<string> {
  const claims = await getBlokmateSessionClaims();
  if (!claims) {
    throw new Error(
      "Tenant bilgisi bulunamadı — oturumun süresi dolmuş olabilir. Lütfen tekrar giriş yapın."
    );
  }
  return claims.tenant_id;
}

export type Building = { id: string; name: string; address: string | null; unit_count: number };
export type Unit = { id: string; building_id: string; label: string; owner_name: string | null };
export type Invoice = {
  id: string;
  unit_id: string;
  amount_cents: number;
  currency: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue" | "void";
  description: string | null;
};
export type Payment = {
  id: string;
  invoice_id: string;
  amount_cents: number;
  paid_at: string;
  method: string;
  reference: string | null;
};
export type Announcement = {
  id: string;
  building_id: string;
  title: string;
  body: string;
  published_at: string;
};
export type Ticket = {
  id: string;
  building_id: string;
  unit_id: string | null;
  subject: string;
  body: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
};

function client() {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY eksik).");
  return supabase;
}

export async function listBuildings(): Promise<Building[]> {
  const { data, error } = await client().from("buildings").select("id, name, address, unit_count").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBuilding(input: { name: string; address?: string }): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client()
    .from("buildings")
    .insert({ name: input.name, address: input.address || null, tenant_id });
  if (error) throw new Error(error.message);
}

export async function listUnits(): Promise<Unit[]> {
  const { data, error } = await client().from("units").select("id, building_id, label, owner_name").order("label");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createUnit(input: { building_id: string; label: string; owner_name?: string }): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client()
    .from("units")
    .insert({ building_id: input.building_id, label: input.label, owner_name: input.owner_name || null, tenant_id });
  if (error) throw new Error(error.message);
}

export async function listInvoices(): Promise<Invoice[]> {
  const { data, error } = await client()
    .from("invoices")
    .select("id, unit_id, amount_cents, currency, due_date, status, description")
    .order("due_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInvoice(input: {
  unit_id: string;
  amount_cents: number;
  due_date: string;
  description?: string;
}): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client().from("invoices").insert({
    unit_id: input.unit_id,
    amount_cents: input.amount_cents,
    due_date: input.due_date,
    description: input.description || null,
    tenant_id,
  });
  if (error) throw new Error(error.message);
}

export async function listPayments(): Promise<Payment[]> {
  const { data, error } = await client()
    .from("payments")
    .select("id, invoice_id, amount_cents, paid_at, method, reference")
    .order("paid_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await client()
    .from("announcements")
    .select("id, building_id, title, body, published_at")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAnnouncement(input: { building_id: string; title: string; body: string }): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client()
    .from("announcements")
    .insert({ building_id: input.building_id, title: input.title, body: input.body, tenant_id });
  if (error) throw new Error(error.message);
}

export async function listTickets(): Promise<Ticket[]> {
  const { data, error } = await client()
    .from("tickets")
    .select("id, building_id, unit_id, subject, body, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTicket(input: { building_id: string; unit_id?: string; subject: string; body?: string }): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client().from("tickets").insert({
    building_id: input.building_id,
    unit_id: input.unit_id || null,
    subject: input.subject,
    body: input.body || null,
    tenant_id,
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Naming aliases — same functions, dashboard-oriented names. Kept as thin
// re-exports rather than duplicate implementations so there's exactly one
// query per entity to keep RLS-correct.
// ---------------------------------------------------------------------------
export const fetchBuildings = listBuildings;
export const fetchUnits = listUnits;
export const fetchInvoices = listInvoices;
export const fetchPayments = listPayments;
export const fetchAnnouncements = listAnnouncements;
export const fetchTickets = listTickets;

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export type MonthlyTotal = { month: string; totalCents: number };

export type DashboardMetrics = {
  totalUnits: number;
  totalDebtCents: number;
  paidInvoiceCount: number;
  pendingInvoiceCount: number;
  openTicketCount: number;
  activeAnnouncementCount: number;
  monthlyCollection: MonthlyTotal[];
  accrual: {
    totalInvoicedCents: number;
    totalPaidCents: number;
    percentCollected: number;
  };
  currency: string;
};

/**
 * One aggregate fetch for the dashboard's metric cards + charts. All four
 * underlying queries go through the same RLS-scoped client as every other
 * function in this file — a manager gets tenant-wide numbers, a resident
 * gets numbers computed only from the rows RLS lets them see (their own
 * unit's invoices/payments), not because this function special-cases
 * role, but because that's all the query can return either way.
 *
 * Two metrics from the original ask are deliberately NOT computed here:
 * "aylık gider" (monthly expenses) and "kasa-banka durumu" (cash/bank
 * reconciliation) have no backing table in this schema (see
 * supabase/migrations/001_init_blokmate.sql) — there's no expense/ledger
 * model yet. Rather than fabricate numbers on a financial dashboard, the
 * dashboard page renders an honest "not yet tracked" state for those two
 * instead of calling into this function for them.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [units, invoices, payments, tickets, announcements] = await Promise.all([
    listUnits(),
    listInvoices(),
    listPayments(),
    listTickets(),
    listAnnouncements(),
  ]);

  const currency = invoices[0]?.currency ?? "BGN";
  const paid = invoices.filter((i) => i.status === "paid");
  const pending = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
  const totalDebtCents = pending.reduce((sum, i) => sum + i.amount_cents, 0);
  const totalInvoicedCents = invoices.reduce((sum, i) => sum + i.amount_cents, 0);
  const totalPaidCents = paid.reduce((sum, i) => sum + i.amount_cents, 0);
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");

  // Last 6 calendar months, oldest first, keyed "YYYY-MM" — filled with 0
  // for months with no payments so the chart doesn't just skip gaps.
  const now = new Date();
  const months: MonthlyTotal[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, totalCents: 0 };
  });
  for (const p of payments) {
    const key = p.paid_at.slice(0, 7);
    const bucket = months.find((m) => m.month === key);
    if (bucket) bucket.totalCents += p.amount_cents;
  }

  return {
    totalUnits: units.length,
    totalDebtCents,
    paidInvoiceCount: paid.length,
    pendingInvoiceCount: pending.length,
    openTicketCount: openTickets.length,
    activeAnnouncementCount: announcements.length,
    monthlyCollection: months,
    accrual: {
      totalInvoicedCents,
      totalPaidCents,
      percentCollected: totalInvoicedCents > 0 ? Math.round((totalPaidCents / totalInvoicedCents) * 100) : 0,
    },
    currency,
  };
}
