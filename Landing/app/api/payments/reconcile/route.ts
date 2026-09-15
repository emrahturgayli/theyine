import { NextRequest, NextResponse } from "next/server";
import { getBlokmateSupabase } from "@/lib/blokmate";
import { getBlokmateStripe } from "@/lib/blokmate-stripe";
import { markInvoicePaidFromMetadata } from "@/app/api/payments/webhook/route";

/**
 * Daily Stripe/Supabase reconciliation sweep (vercel.json schedules this).
 * Closes the gap the webhook alone can't cover: if Stripe's webhook
 * delivery to /api/payments/webhook never arrives (network blip, a
 * misconfigured STRIPE_WEBHOOK_SECRET, Stripe's retries exhausted before
 * the app recovered), the invoice stays "unpaid" forever even though the
 * resident's card was actually charged — see create-session/route.ts,
 * which now stores the Checkout Session id on the invoice specifically so
 * this job can look it back up.
 *
 * This does not replace the webhook — it's a same-day safety net that
 * asks Stripe directly "did this still-open invoice's session actually
 * get paid?" for every invoice the webhook should have already closed.
 *
 * Auth follows the same pattern as app/api/cron/reminders/route.ts: a
 * Bearer CRON_SECRET check, not Postgres RLS (this uses the service-role
 * client to read across every tenant in one pass) and not end-user auth —
 * Vercel Cron is the only intended caller.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getBlokmateSupabase();
  const stripe = getBlokmateStripe();
  if (!supabase) return NextResponse.json({ error: "Supabase yapılandırılmamış." }, { status: 500 });
  if (!stripe) return NextResponse.json({ error: "Stripe yapılandırılmamış." }, { status: 500 });

  // Bounded to the last 7 days so this stays a fast daily sweep, not an
  // unbounded full-table scan — a session older than that has either long
  // since been reconciled or expired on Stripe's side (Checkout Sessions
  // are only payable for 24h anyway).
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { data: openInvoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, tenant_id, stripe_session_id, status, created_at")
    .in("status", ["unpaid", "overdue"])
    .not("stripe_session_id", "is", null)
    .gte("created_at", cutoff.toISOString());
  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }
  if (!openInvoices || openInvoices.length === 0) {
    return NextResponse.json({ checked: 0, reconciled: 0 });
  }

  let reconciled = 0;
  const failures: Array<{ invoice_id: string; error: string }> = [];

  for (const invoice of openInvoices) {
    if (!invoice.stripe_session_id) continue;
    try {
      const session = await stripe.checkout.sessions.retrieve(invoice.stripe_session_id);
      if (session.payment_status !== "paid") continue;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id;

      const { status } = await markInvoicePaidFromMetadata(supabase, session.metadata, paymentIntentId);
      if (status === 200) reconciled += 1;
      else failures.push({ invoice_id: invoice.id, error: `mark-paid returned ${status}` });
    } catch (err) {
      failures.push({
        invoice_id: invoice.id,
        error: err instanceof Error ? err.message : "unknown_error",
      });
    }
  }

  if (failures.length > 0) {
    console.error("[payments/reconcile] failures:", JSON.stringify(failures));
  }

  return NextResponse.json({ checked: openInvoices.length, reconciled, failures });
}
