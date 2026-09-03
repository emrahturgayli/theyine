"use client";

import { getBlokmateSupabaseBrowser } from "@/lib/blokmate-supabase-browser";

/**
 * Live dashboard queries for an authenticated BlokMate session. Every
 * query here goes through the anon-key browser client, so Postgres RLS
 * (supabase/migrations/002_add_tenant_id_and_rls.sql) is the actual
 * enforcement boundary — a manager's session sees every row for their
 * tenant, a resident's session sees only their own unit, and that's true
 * even if these functions had a bug in their .eq() filters below. The
 * explicit filters are still included as defense-in-depth and to keep the
 * query intent readable, not because they're load-bearing for isolation.
 *
 * NOTE: app/blokmate/components/Dashboard.tsx (the one rendered on the
 * public /blokmate marketing page) intentionally still uses static mock
 * data — it's a logged-out landing-page preview, not a real session, so
 * there's no tenant/unit context for it to query with. These functions
 * are for a future authenticated dashboard route; wire them in once that
 * route/login flow exists.
 */

export type DashboardInvoice = {
  id: string;
  unit_id: string;
  amount_cents: number;
  currency: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue" | "void";
  description: string | null;
};

export type DashboardUnit = {
  id: string;
  building_id: string;
  label: string;
  owner_name: string | null;
};

export type DashboardAnnouncement = {
  id: string;
  building_id: string;
  title: string;
  body: string;
  published_at: string;
};

/**
 * Manager/accountant/auditor view: every unit and invoice for the caller's
 * tenant. tenant_id isn't passed in — it's read from the caller's own JWT
 * on the server side by RLS, not supplied by the client, so there's no way
 * for a caller to pass someone else's tenant_id and see their data.
 */
export async function fetchManagerDashboard(): Promise<{
  units: DashboardUnit[];
  invoices: DashboardInvoice[];
  announcements: DashboardAnnouncement[];
} | null> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) return null;

  const [unitsRes, invoicesRes, announcementsRes] = await Promise.all([
    supabase.from("units").select("id, building_id, label, owner_name"),
    supabase
      .from("invoices")
      .select("id, unit_id, amount_cents, currency, due_date, status, description")
      .order("due_date", { ascending: true }),
    supabase
      .from("announcements")
      .select("id, building_id, title, body, published_at")
      .order("published_at", { ascending: false }),
  ]);

  if (unitsRes.error) throw new Error(unitsRes.error.message);
  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (announcementsRes.error) throw new Error(announcementsRes.error.message);

  return {
    units: unitsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    announcements: announcementsRes.data ?? [],
  };
}

/**
 * Resident view: `unitId` narrows the query for readability/intent, but
 * the actual isolation guarantee is the `invoices_select` / `units_select`
 * RLS policy — a resident's session can only ever match rows for their
 * own unit_id regardless of what's passed here, because the policy ANDs
 * in `unit_id = blokmate_current_unit_id()` (resolved server-side from
 * their session, not from this argument).
 */
export async function fetchResidentDashboard(unitId: string): Promise<{
  unit: DashboardUnit | null;
  invoices: DashboardInvoice[];
  announcements: DashboardAnnouncement[];
} | null> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) return null;

  const [unitRes, invoicesRes] = await Promise.all([
    supabase.from("units").select("id, building_id, label, owner_name").eq("id", unitId).maybeSingle(),
    supabase
      .from("invoices")
      .select("id, unit_id, amount_cents, currency, due_date, status, description")
      .eq("unit_id", unitId)
      .order("due_date", { ascending: true }),
  ]);

  if (unitRes.error) throw new Error(unitRes.error.message);
  if (invoicesRes.error) throw new Error(invoicesRes.error.message);

  const unit = unitRes.data;
  let announcements: DashboardAnnouncement[] = [];
  if (unit) {
    const announcementsRes = await supabase
      .from("announcements")
      .select("id, building_id, title, body, published_at")
      .eq("building_id", unit.building_id)
      .order("published_at", { ascending: false });
    if (announcementsRes.error) throw new Error(announcementsRes.error.message);
    announcements = announcementsRes.data ?? [];
  }

  return { unit: unit ?? null, invoices: invoicesRes.data ?? [], announcements };
}
