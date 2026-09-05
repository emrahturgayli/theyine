import { NextRequest, NextResponse } from "next/server";
import { getBlokmateSupabase } from "@/lib/blokmate";

/**
 * Daily due-date reminder sweep (vercel.json schedules this at 08:00 UTC).
 * Scans every unpaid/overdue invoice due within the next 3 days or
 * already past due, and inserts a `reminder_due` notification for each
 * unit's resident(s) — at most one per invoice per calendar day, so a
 * cron retry or an invoice that's been due for a week doesn't spam the
 * same resident daily... actually it WILL re-notify daily once overdue,
 * which is the intended behavior; the per-day dedupe only guards against
 * this route firing twice in the same day (a manual re-trigger, a retried
 * Vercel invocation) inserting duplicate rows.
 *
 * Uses the service-role client (lib/blokmate.ts) — this needs to read and
 * write across every tenant in one pass, which no RLS-scoped anon-key
 * query could do; the actual access control here is the Bearer secret
 * check below, not Postgres RLS.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getBlokmateSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase yapılandırılmamış." }, { status: 500 });
  }

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 3);
  const todayStr = today.toISOString().slice(0, 10);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data: dueInvoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, tenant_id, unit_id, due_date, status")
    .in("status", ["unpaid", "overdue"])
    .lte("due_date", cutoffStr);
  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }
  if (!dueInvoices || dueInvoices.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const invoiceIds = dueInvoices.map((i) => i.id);

  // Dedupe: skip any invoice that already got a reminder_due row today.
  const { data: alreadyNotified } = await supabase
    .from("notifications")
    .select("related_invoice_id")
    .eq("type", "reminder_due")
    .in("related_invoice_id", invoiceIds)
    .gte("created_at", `${todayStr}T00:00:00Z`);
  const alreadyNotifiedIds = new Set((alreadyNotified ?? []).map((n) => n.related_invoice_id));

  const pendingInvoices = dueInvoices.filter((i) => !alreadyNotifiedIds.has(i.id));
  if (pendingInvoices.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const unitIds = [...new Set(pendingInvoices.map((i) => i.unit_id))];
  const { data: residents, error: residentsError } = await supabase
    .from("users")
    .select("id, unit_id, tenant_id")
    .in("unit_id", unitIds);
  if (residentsError) {
    return NextResponse.json({ error: residentsError.message }, { status: 500 });
  }

  const rows = pendingInvoices.flatMap((invoice) =>
    (residents ?? [])
      .filter((r) => r.unit_id === invoice.unit_id)
      .map((r) => ({
        tenant_id: invoice.tenant_id,
        user_id: r.id,
        type: "reminder_due" as const,
        related_invoice_id: invoice.id,
        message:
          invoice.due_date < todayStr
            ? "Aidat ödemenizin vadesi geçti."
            : `Aidat ödemenizin son tarihi ${invoice.due_date}.`,
      }))
  );

  if (rows.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const { error: insertError } = await supabase.from("notifications").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ notified: rows.length });
}
