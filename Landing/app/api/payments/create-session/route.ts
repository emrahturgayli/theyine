import { NextResponse } from "next/server";
import { getBlokmateSupabase } from "@/lib/blokmate";
import { getBlokmateStripe } from "@/lib/blokmate-stripe";
import { decodeBlokmateAccessToken } from "@/lib/blokmate-server-auth";

/**
 * Starts a real Stripe Checkout session for one invoice — replaces the
 * Phase-4 mock (lib/blokmate-payments.ts's completeMockPayment, which
 * wrote payments/invoices directly from the browser). This route uses the
 * service-role Supabase client (bypasses RLS), so the authorization check
 * below — tenant match, and unit ownership for a non-manager caller — is
 * the actual gate, not a defense-in-depth extra on top of RLS.
 *
 * The invoice is never marked paid here. That only happens in
 * app/api/payments/webhook/route.ts, after Stripe confirms the charge via
 * a signature-verified event — this route's job ends at handing back a
 * redirect URL.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const claims = decodeBlokmateAccessToken(token);
  if (!claims) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // unit_id/amount/currency are accepted (the client may send them for its
  // own display purposes) but deliberately never trusted for the charge
  // itself — every value Stripe actually charges comes from the `invoice`
  // row looked up below by invoice_id. Trusting a client-supplied amount
  // here would let anyone pay their own invoice for whatever amount they
  // chose to send.
  let body: { invoice_id?: string; unit_id?: string; amount?: number; currency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.invoice_id) {
    return NextResponse.json({ error: "invoice_id_required" }, { status: 400 });
  }

  const supabase = getBlokmateSupabase();
  const stripe = getBlokmateStripe();
  if (!supabase) return NextResponse.json({ error: "Supabase yapılandırılmamış." }, { status: 500 });
  if (!stripe) return NextResponse.json({ error: "Stripe yapılandırılmamış (STRIPE_SECRET_KEY eksik)." }, { status: 500 });

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, tenant_id, unit_id, amount_cents, status")
    .eq("id", body.invoice_id)
    .maybeSingle();
  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  if (!invoice || invoice.tenant_id !== claims.tenantId) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });
  }

  const isManager = claims.role === "manager" || claims.role === "accountant";
  if (!isManager) {
    const { data: user } = await supabase.from("users").select("unit_id").eq("id", claims.userId).maybeSingle();
    if (!user || !user.unit_id || user.unit_id !== invoice.unit_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  if (invoice.status !== "unpaid" && invoice.status !== "overdue") {
    return NextResponse.json({ error: "Bu aidat zaten ödenmiş ya da ödenebilir durumda değil." }, { status: 400 });
  }

  const { data: tenantSettings } = await supabase
    .from("tenant_settings")
    .select("currency")
    .eq("tenant_id", invoice.tenant_id)
    .maybeSingle();
  const currency = (tenantSettings?.currency || "TRY").toLowerCase();

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.theyine.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "BlokMate — Aidat ödemesi" },
            unit_amount: invoice.amount_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        user_id: claims.userId,
      },
      // Session-level metadata does NOT propagate to the underlying
      // PaymentIntent automatically — set it again here so
      // payment_intent.succeeded (handled by the webhook alongside
      // checkout.session.completed) can also resolve invoice_id/tenant_id.
      payment_intent_data: {
        metadata: {
          invoice_id: invoice.id,
          tenant_id: invoice.tenant_id,
          user_id: claims.userId,
        },
      },
      success_url: `${origin}/blokmate/invoices?payment=success`,
      cancel_url: `${origin}/blokmate/invoices?payment=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[payments/create-session] Stripe error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ödeme oturumu oluşturulamadı." }, { status: 502 });
  }
}
