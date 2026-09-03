import { NextResponse } from "next/server";
import { getBlokmateSupabase } from "@/lib/blokmate";

/**
 * Payment provider webhook scaffold (Stripe or iyzico — BlokMate's likely
 * market, Bulgaria/Turkey, makes either plausible; pick one before this
 * goes live, the signature-verification step differs between them).
 *
 * TODO before production:
 *  - Real signature verification. This currently only checks that *a*
 *    signature header is present — that is NOT authentication, anyone can
 *    send a request with any bytes in that header. Replace with:
 *      Stripe:  stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
 *      iyzico:  provider-specific HMAC verification against IYZICO_SECRET_KEY
 *  - Read the raw request body for signature verification (most providers
 *    sign the exact raw bytes — request.text() below preserves that;
 *    don't switch to request.json() before verifying, it can change
 *    whitespace/key-order and invalidate the signature check).
 *  - Map the provider's event/payload shape to invoice_id + amount — the
 *    parsing below is a placeholder shape, not any real provider's schema.
 *  - Idempotency: providers retry webhooks on timeout/non-2xx. Insert a
 *    unique constraint on payments.reference (the provider's event/charge
 *    id) so a retried delivery doesn't double-record the same payment.
 *
 * Tenant isolation: this route uses the service_role key, which bypasses
 * RLS (supabase/migrations/002_add_tenant_id_and_rls.sql) entirely — the
 * invoice-lookup-then-insert pattern below is what actually prevents a
 * payment from being attributed to the wrong tenant, RLS provides no
 * backstop here the way it does for client-side dashboard queries.
 *
 * Env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (writes),
 * and whichever of STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET or
 * IYZICO_API_KEY/IYZICO_SECRET_KEY the chosen provider needs.
 */
export const runtime = "nodejs";

type WebhookPayload = {
  invoiceId?: string;
  amountCents?: number;
  reference?: string;
};

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") ?? request.headers.get("x-iyzico-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  const rawBody = await request.text();

  // TODO(payments): replace with real signature verification before
  // production — see the file-level comment above. Without this, anyone
  // who finds this URL can mark arbitrary invoices as paid.
  console.warn(
    "[blokmate-payments] Signature present but NOT cryptographically verified — placeholder only."
  );

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload.invoiceId || typeof payload.amountCents !== "number") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = getBlokmateSupabase();
  if (!supabase) {
    console.warn(
      "[blokmate-payments] Supabase skipped: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set"
    );
    return NextResponse.json({ ok: true, simulated: true });
  }

  // payments.tenant_id is NOT NULL (migration 002) and the webhook payload
  // has no notion of tenant — it only names an invoice. Look the invoice
  // up first so the payment row is tagged with *that invoice's* tenant,
  // never a client-supplied value: nothing in this request is trusted
  // enough to assert its own tenant_id.
  const { data: invoice, error: invoiceLookupError } = await supabase
    .from("invoices")
    .select("id, tenant_id")
    .eq("id", payload.invoiceId)
    .maybeSingle();
  if (invoiceLookupError) {
    console.error("[blokmate-payments] invoice lookup failed:", invoiceLookupError.message);
    return NextResponse.json({ error: "db_read_failed" }, { status: 500 });
  }
  if (!invoice) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    tenant_id: invoice.tenant_id,
    amount_cents: payload.amountCents,
    method: "card",
    reference: payload.reference ?? null,
  });
  if (paymentError) {
    console.error("[blokmate-payments] payment insert failed:", paymentError.message);
    return NextResponse.json({ error: "db_write_failed" }, { status: 500 });
  }

  // service_role bypasses RLS, so this .eq("tenant_id", ...) isn't required
  // for correctness (invoice.id + invoice.tenant_id are already consistent
  // by construction, from the lookup above) — kept anyway as an explicit,
  // defense-in-depth guard against ever widening this update's WHERE
  // clause later without re-adding tenant scoping.
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoice.id)
    .eq("tenant_id", invoice.tenant_id);
  if (invoiceError) {
    console.error("[blokmate-payments] invoice status update failed:", invoiceError.message);
    // Payment is already recorded — don't fail the webhook over a status
    // update the provider will retry into duplicate payment rows anyway.
  }

  return NextResponse.json({ ok: true });
}
