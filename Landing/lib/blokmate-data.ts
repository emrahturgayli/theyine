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

export type Building = {
  id: string;
  name: string;
  address: string | null;
  unit_count: number;
  standard_due_amount_cents: number | null;
};
export type Unit = { id: string; building_id: string; label: string; owner_name: string | null };
export type Invoice = {
  id: string;
  unit_id: string;
  amount_cents: number;
  currency: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue" | "void";
  description: string | null;
  period: string | null;
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
  attachment_url: string | null;
};
export type Ticket = {
  id: string;
  building_id: string;
  unit_id: string | null;
  reported_by_user_id: string | null;
  subject: string;
  body: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  category: "general" | "payment_notice";
  attachment_url: string | null;
  created_at: string;
};
export type Notification = {
  id: string;
  user_id: string;
  type:
    | "announcement_published"
    | "invoice_issued"
    | "ticket_updated"
    | "payment_completed"
    | "reminder_due"
    | "broadcast_message";
  related_announcement_id: string | null;
  related_invoice_id: string | null;
  related_ticket_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
};
export type TenantPlan = "starter" | "pro" | "enterprise";
export type TenantSettings = {
  tenant_id: string;
  currency: "TRY" | "EUR" | "BGN" | null;
  display_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notify_email: boolean;
  plan: TenantPlan;
  stripe_customer_id: string | null;
};
export type Comment = {
  id: string;
  building_id: string;
  announcement_id: string | null;
  ticket_id: string | null;
  user_id: string;
  message: string;
  created_at: string;
};

function client() {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY eksik).");
  return supabase;
}

export async function listBuildings(): Promise<Building[]> {
  const { data, error } = await client()
    .from("buildings")
    .select("id, name, address, unit_count, standard_due_amount_cents")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBuilding(input: {
  name: string;
  address?: string;
  standard_due_amount_cents?: number;
}): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client().from("buildings").insert({
    name: input.name,
    address: input.address || null,
    standard_due_amount_cents: input.standard_due_amount_cents ?? null,
    tenant_id,
  });
  if (error) throw new Error(error.message);
}

/**
 * tenant_id is intentionally NOT part of the update payload — RLS's
 * `using` clause already requires the existing row to belong to the
 * caller's tenant for it to even be matched, and since this payload never
 * changes tenant_id, the `with check` re-verification passes trivially.
 * Passing tenant_id here would do nothing except risk a typo breaking a
 * legitimate update.
 */
export async function updateBuilding(
  id: string,
  input: { name: string; address?: string; standard_due_amount_cents?: number | null }
): Promise<void> {
  const { error } = await client()
    .from("buildings")
    .update({
      name: input.name,
      address: input.address || null,
      standard_due_amount_cents: input.standard_due_amount_cents ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBuilding(id: string): Promise<void> {
  const { error } = await client().from("buildings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Building ids for the units in one building — used by the list*
 * functions below to scope invoices/payments (which have no building_id
 * column of their own) to the global "Bina Seç" filter without an
 * embedded-resource join per call. RLS still applies to this query same
 * as listUnits, so a resident passing another building's id here just
 * gets an empty array back, not another tenant's/building's unit ids.
 */
async function unitIdsForBuilding(buildingId: string): Promise<string[]> {
  const { data, error } = await client().from("units").select("id").eq("building_id", buildingId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((u) => u.id);
}

export async function listUnits(buildingId?: string): Promise<Unit[]> {
  let query = client().from("units").select("id, building_id, label, owner_name");
  if (buildingId) query = query.eq("building_id", buildingId);
  const { data, error } = await query.order("label");
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

export async function updateUnit(
  id: string,
  input: { building_id: string; label: string; owner_name?: string }
): Promise<void> {
  const { error } = await client()
    .from("units")
    .update({ building_id: input.building_id, label: input.label, owner_name: input.owner_name || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await client().from("units").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listInvoices(buildingId?: string): Promise<Invoice[]> {
  let query = client().from("invoices").select("id, unit_id, amount_cents, currency, due_date, status, description, period");
  if (buildingId) {
    const unitIds = await unitIdsForBuilding(buildingId);
    if (unitIds.length === 0) return [];
    query = query.in("unit_id", unitIds);
  }
  const { data, error } = await query.order("due_date", { ascending: false });
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

export type AccrueDuesResult = { created: number; skipped: number; totalUnits: number };

/**
 * "Aylık Aidatları Tahakkuk Et" — bulk-creates one invoice per unit in a
 * building at the building's standard_due_amount_cents (migration 015),
 * tagged with `period` ('YYYY-MM'). There's no vacancy/occupancy concept
 * in this schema (units have no "empty" flag), so "her dolu daireye"
 * from SPEC.md Section 6 is read as "every unit in the building" — every
 * unit that exists is billable, whether or not a resident portal account
 * has been provisioned for it yet.
 *
 * Idempotent by construction, not by pre-checking: this uses `upsert`
 * with `ignoreDuplicates: true` against the (unit_id, period) unique
 * index (migration 015), so re-running it for a period already accrued
 * just silently skips the units that already have one — a manager who
 * double-clicks the button, or runs it again after adding a new unit
 * mid-month, can't double-bill anyone. `skipped` in the result reflects
 * exactly that.
 */
export async function accrueMonthlyDues(input: {
  building_id: string;
  period: string;
  due_date: string;
}): Promise<AccrueDuesResult> {
  const tenant_id = await requireTenantId();
  const supabase = client();

  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .select("standard_due_amount_cents")
    .eq("id", input.building_id)
    .maybeSingle();
  if (buildingError) throw new Error(buildingError.message);
  if (!building?.standard_due_amount_cents) {
    throw new Error("Bu bina için önce Standart Aidat Tutarı belirlemelisin.");
  }

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id")
    .eq("building_id", input.building_id);
  if (unitsError) throw new Error(unitsError.message);
  if (!units || units.length === 0) {
    return { created: 0, skipped: 0, totalUnits: 0 };
  }

  const rows = units.map((u) => ({
    tenant_id,
    unit_id: u.id,
    amount_cents: building.standard_due_amount_cents!,
    due_date: input.due_date,
    period: input.period,
    description: `${input.period} dönemi aidatı`,
  }));

  const { data: insertedRows, error: insertError } = await supabase
    .from("invoices")
    .upsert(rows, { onConflict: "unit_id,period", ignoreDuplicates: true })
    .select("id");
  if (insertError) throw new Error(insertError.message);

  const created = insertedRows?.length ?? 0;
  return { created, skipped: units.length - created, totalUnits: units.length };
}

/**
 * Manager-only quick action: records a full payment against an invoice
 * and flips its status to "paid". Both writes go through the anon-key
 * client — RLS's payments_insert/invoices_update policies
 * (supabase/migrations/002_add_tenant_id_and_rls.sql) already restrict
 * this to role in ('manager', 'accountant'), so a resident calling this
 * directly would get rejected server-side even if the UI didn't hide the
 * button. Not wrapped in a DB transaction (no RPC for that exists yet) —
 * if the invoice update fails after the payment insert succeeds, the
 * payment row still exists (money was recorded) but the invoice stays
 * "unpaid"; surfaced as an error so the manager knows to recheck rather
 * than silently mismatching.
 */
export async function markInvoicePaid(
  invoice: Pick<Invoice, "id" | "amount_cents">,
  method: "bank_transfer" | "card" | "cash" | "other" = "cash"
): Promise<void> {
  const tenant_id = await requireTenantId();
  const supabase = client();

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    amount_cents: invoice.amount_cents,
    method,
    tenant_id,
  });
  if (paymentError) throw new Error(paymentError.message);

  const { error: invoiceError } = await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
  if (invoiceError) {
    throw new Error(
      `Ödeme kaydedildi ancak fatura durumu güncellenemedi: ${invoiceError.message}`
    );
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await client().from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Manager-only reversal of markInvoicePaid — flips a mistakenly (or
 * fraudulently) confirmed invoice back to "unpaid". RLS (migration 012)
 * restricts this transition to manager/accountant; a resident's own
 * invoices_update grant only ever allows unpaid/overdue -> paid, never
 * the other direction. Deliberately does not delete the payment row it's
 * reversing — that stays as an audit trail of what was recorded and later
 * cancelled, same rationale as markInvoicePaid not being wrapped in a
 * transaction.
 */
export async function markInvoiceUnpaid(invoiceId: string): Promise<void> {
  const { error } = await client().from("invoices").update({ status: "unpaid" }).eq("id", invoiceId);
  if (error) throw new Error(error.message);
}

export async function listPayments(buildingId?: string): Promise<Payment[]> {
  let query = client().from("payments").select("id, invoice_id, amount_cents, paid_at, method, reference");
  if (buildingId) {
    const unitIds = await unitIdsForBuilding(buildingId);
    if (unitIds.length === 0) return [];
    const { data: invoiceRows, error: invoicesError } = await client()
      .from("invoices")
      .select("id")
      .in("unit_id", unitIds);
    if (invoicesError) throw new Error(invoicesError.message);
    const invoiceIds = (invoiceRows ?? []).map((i) => i.id);
    if (invoiceIds.length === 0) return [];
    query = query.in("invoice_id", invoiceIds);
  }
  const { data, error } = await query.order("paid_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAnnouncements(buildingId?: string): Promise<Announcement[]> {
  let query = client()
    .from("announcements")
    .select("id, building_id, title, body, published_at, attachment_url");
  if (buildingId) query = query.eq("building_id", buildingId);
  const { data, error } = await query.order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAnnouncement(input: {
  building_id: string;
  title: string;
  body: string;
  attachment_url?: string;
}): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client().from("announcements").insert({
    building_id: input.building_id,
    title: input.title,
    body: input.body,
    attachment_url: input.attachment_url ?? null,
    tenant_id,
  });
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await client().from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listTickets(buildingId?: string): Promise<Ticket[]> {
  let query = client()
    .from("tickets")
    .select("id, building_id, unit_id, reported_by_user_id, subject, body, status, category, attachment_url, created_at");
  if (buildingId) query = query.eq("building_id", buildingId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTicket(input: {
  building_id: string;
  unit_id?: string;
  subject: string;
  body?: string;
  category?: Ticket["category"];
  attachment_url?: string;
}): Promise<void> {
  const tenant_id = await requireTenantId();
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("tickets").insert({
    building_id: input.building_id,
    unit_id: input.unit_id || null,
    subject: input.subject,
    body: input.body || null,
    category: input.category ?? "general",
    attachment_url: input.attachment_url ?? null,
    reported_by_user_id: user?.id ?? null,
    tenant_id,
  });
  if (error) throw new Error(error.message);
}

export async function listCommentsForAnnouncement(announcementId: string): Promise<Comment[]> {
  const { data, error } = await client()
    .from("comments")
    .select("id, building_id, announcement_id, ticket_id, user_id, message, created_at")
    .eq("announcement_id", announcementId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listCommentsForTicket(ticketId: string): Promise<Comment[]> {
  const { data, error } = await client()
    .from("comments")
    .select("id, building_id, announcement_id, ticket_id, user_id, message, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * RLS's comments_insert policy (supabase/migrations/007_add_comments_and_resident_scoping.sql)
 * is the actual gate on who may post where — a resident commenting on an
 * announcement outside their building, or a ticket they didn't file, gets
 * rejected there even if this function is called directly. user_id must
 * equal auth.uid() per that policy, so it's read from the session rather
 * than trusted from a caller-supplied value.
 */
export async function createComment(input: {
  building_id: string;
  announcement_id?: string;
  ticket_id?: string;
  message: string;
}): Promise<void> {
  const tenant_id = await requireTenantId();
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı — lütfen tekrar giriş yapın.");

  const { error } = await supabase.from("comments").insert({
    tenant_id,
    building_id: input.building_id,
    announcement_id: input.announcement_id ?? null,
    ticket_id: input.ticket_id ?? null,
    user_id: user.id,
    message: input.message,
  });
  if (error) throw new Error(error.message);
}

export async function listNotifications(): Promise<Notification[]> {
  const { data, error } = await client()
    .from("notifications")
    .select("id, user_id, type, related_announcement_id, related_invoice_id, related_ticket_id, message, is_read, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotificationRead(id: string, isRead = true): Promise<void> {
  const { error } = await client().from("notifications").update({ is_read: isRead }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await client().from("notifications").update({ is_read: true }).eq("is_read", false);
  if (error) throw new Error(error.message);
}

/**
 * Manager/staff-only (notifications_insert RLS, migration 011) — fans a
 * single message out to every resident of one building in a single
 * insert. Unlike the trigger-driven notification types, this one has no
 * announcement/invoice/ticket row backing it, so the text lives directly
 * on each notification row via `message`.
 */
export async function sendBroadcastNotification(input: { building_id: string; message: string }): Promise<number> {
  const tenant_id = await requireTenantId();
  const supabase = client();

  const { data: recipients, error: recipientsError } = await supabase
    .from("users")
    .select("id, units!inner(building_id)")
    .eq("tenant_id", tenant_id)
    .eq("units.building_id", input.building_id);
  if (recipientsError) throw new Error(recipientsError.message);
  if (!recipients || recipients.length === 0) return 0;

  const { error } = await supabase.from("notifications").insert(
    recipients.map((r) => ({
      tenant_id,
      user_id: r.id,
      type: "broadcast_message" as const,
      message: input.message,
    }))
  );
  if (error) throw new Error(error.message);
  return recipients.length;
}

/**
 * Returns null when no row exists yet — every tenant starts without one
 * (see supabase/migrations/009_add_tenant_settings.sql), and callers should
 * fall back to the locale-driven defaults in lib/blokmate-currency.ts
 * rather than treat a missing row as an error.
 */
export async function getTenantSettings(): Promise<TenantSettings | null> {
  const { data, error } = await client()
    .from("tenant_settings")
    .select("tenant_id, currency, display_name, contact_email, contact_phone, notify_email, plan, stripe_customer_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * Manager-only (tenant_settings_insert/update RLS, migration 009).
 * Upserts on tenant_id since a tenant may be saving settings for the
 * first time (no row yet) or editing an existing one. Deliberately has
 * no `stripe_customer_id` param — that's only ever set server-side, once
 * a real Stripe Billing subscription/customer exists for the tenant, not
 * something a manager types into a form.
 */
export async function upsertTenantSettings(input: {
  currency?: TenantSettings["currency"];
  display_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notify_email?: boolean;
  plan?: TenantPlan;
}): Promise<void> {
  const tenant_id = await requireTenantId();
  const { error } = await client()
    .from("tenant_settings")
    .upsert({ tenant_id, ...input }, { onConflict: "tenant_id" });
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
export async function fetchDashboardMetrics(buildingId?: string): Promise<DashboardMetrics> {
  const [units, invoices, payments, tickets, announcements] = await Promise.all([
    listUnits(buildingId),
    listInvoices(buildingId),
    listPayments(buildingId),
    listTickets(buildingId),
    listAnnouncements(buildingId),
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
