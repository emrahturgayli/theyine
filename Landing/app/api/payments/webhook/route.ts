import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getBlokmateSupabase } from "@/lib/blokmate";
import { getBlokmateStripe } from "@/lib/blokmate-stripe";

/**
 * Real Stripe webhook — supersedes the Phase-4 scaffold at
 * app/api/blokmate/payments/route.ts (deleted), which only checked that
 * *a* signature header was present, not that it was valid. This route
 * verifies the payload against STRIPE_WEBHOOK_SECRET via
 * stripe.webhooks.constructEvent(), which is why the raw body is read
 * with request.text() rather than request.json() — Stripe signs the
 * exact bytes it sent, and re-serializing a parsed object can produce
 * different bytes (whitespace, key order) that fail verification.
 *
 * Handles three event types:
 *   - checkout.session.completed — the normal path for a resident/manager
 *     paying one aidat invoice via the "Öde" button.
 *   - payment_intent.succeeded — fires alongside checkout.session.completed
 *     for the same charge (payment_intent_data.metadata is set to the same
 *     values when the session is created, see create-session/route.ts).
 *     Handled with the same code path so either arriving first still marks
 *     the invoice paid; the payments.reference unique index (migration
 *     013) makes the second one a no-op instead of a duplicate insert.
 *   - invoice.payment_succeeded — Stripe Billing's subscription-invoice
 *     event, for tenant_settings.plan billing (Starter/Pro/Enterprise),
 *     not a resident's aidat invoice. Stripe Billing itself is
 *     architecture-only in this phase (no real subscription is created
 *     yet), so this is acknowledged and logged, not processed — there is
 *     no BlokMate `invoices` row to reconcile it against.
 *
 * Idempotency: Stripe retries a webhook delivery on timeout/non-2xx, and
 * migration 013 adds a unique index on payments.reference (the Stripe
 * payment_intent id) so a retried delivery can't double-insert — the
 * unique-violation branch below treats that as success rather than an
 * error.
 *
 * Configure this URL (https://<domain>/api/payments/webhook) in the
 * Stripe Dashboard -> Developers -> Webhooks, subscribed to at least
 * checkout.session.completed and payment_intent.succeeded, and copy its
 * signing secret into STRIPE_WEBHOOK_SECRET.
 */
export const runtime = "nodejs";

async function markInvoicePaidFromMetadata(
  supabase: SupabaseClient,
  metadata: Stripe.Metadata | null | undefined,
  paymentReference: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  const invoiceId = metadata?.invoice_id;
  const tenantId = metadata?.tenant_id;
  if (!invoiceId || !tenantId) {
    console.error("[payments/webhook] event missing invoice_id/tenant_id metadata");
    return { status: 400, body: { error: "missing_metadata" } };
  }

  const { data: invoice, error: invoiceLookupError } = await supabase
    .from("invoices")
    .select("id, tenant_id, amount_cents, status")
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (invoiceLookupError) {
    return { status: 500, body: { error: invoiceLookupError.message } };
  }
  if (!invoice) return { status: 404, body: { error: "invoice_not_found" } };

  if (invoice.status === "paid") {
    return { status: 200, body: { received: true, already_paid: true } };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    tenant_id: invoice.tenant_id,
    amount_cents: invoice.amount_cents,
    method: "card",
    reference: paymentReference,
  });
  if (paymentError) {
    if (paymentError.code === "23505") {
      // Unique violation on payments.reference — this charge was already
      // processed by an earlier event (checkout.session.completed and
      // payment_intent.succeeded both carry the same PaymentIntent id).
      return { status: 200, body: { received: true, already_paid: true } };
    }
    console.error("[payments/webhook] payment insert failed:", paymentError.message);
    return { status: 500, body: { error: paymentError.message } };
  }

  // Flips invoices.status -> 'paid', which fires
  // blokmate_notify_invoice_paid (migration 008) to create each unit
  // resident's payment_completed notification — no extra work needed
  // here for that.
  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoice.id)
    .eq("tenant_id", invoice.tenant_id);
  if (invoiceUpdateError) {
    console.error("[payments/webhook] invoice status update failed:", invoiceUpdateError.message);
  }

  return { status: 200, body: { received: true } };
}

export async function POST(request: Request) {
  const stripe = getBlokmateStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    console.error("[payments/webhook] Stripe not configured (STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET missing)");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[payments/webhook] signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = getBlokmateSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 500 });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id;
      const { status, body } = await markInvoicePaidFromMetadata(supabase, session.metadata, paymentIntentId);
      return NextResponse.json(body, { status });
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { status, body } = await markInvoicePaidFromMetadata(supabase, paymentIntent.metadata, paymentIntent.id);
      return NextResponse.json(body, { status });
    }
    case "invoice.payment_succeeded": {
      // Stripe Billing (subscription) event — tenant_settings.plan billing
      // has no live Stripe subscription yet in this phase, so there's
      // nothing to reconcile. Acknowledged so Stripe doesn't retry it.
      console.log("[payments/webhook] invoice.payment_succeeded received — no-op (Stripe Billing not yet wired to a live subscription).");
      return NextResponse.json({ received: true, noop: true });
    }
    default:
      return NextResponse.json({ received: true });
  }
}
