"use client";

import { getBlokmateSupabaseBrowser, getBlokmateSessionClaims } from "@/lib/blokmate-supabase-browser";
import type { Invoice } from "@/lib/blokmate-data";

/**
 * Payment-gateway abstraction. Today there's only a mock/sandbox flow —
 * completeMockPayment() writes the payment + flips the invoice to "paid"
 * directly from the browser client, gated by
 * supabase/migrations/010_allow_resident_self_payment.sql's RLS rather
 * than any real processor. startPaymentSession() exists so call sites
 * (InvoiceTable's "Öde" button, the resident dashboard) don't need to
 * change when a real gateway (Stripe/iyzico) replaces the mock: swap this
 * file's internals for a redirect-to-checkout + webhook flow, keep the
 * same two function signatures.
 */

export type MockPaymentSession = {
  invoice: Pick<Invoice, "id" | "amount_cents" | "currency">;
};

/**
 * Stands in for "create a checkout session with the gateway and return
 * its redirect URL". The mock has nothing to redirect to, so it just
 * echoes the invoice back for the modal to display — a real
 * implementation would call out to Stripe/iyzico here and this function
 * would become async-over-the-network instead of synchronous.
 */
export function startPaymentSession(invoice: Pick<Invoice, "id" | "amount_cents" | "currency">): MockPaymentSession {
  return { invoice };
}

/**
 * Completes the mock session: records a payment row, marks the invoice
 * paid. Both writes go through the anon-key client — RLS is the actual
 * gate on "can this caller pay this invoice" (manager/accountant for any
 * invoice in the tenant, or a resident for their own unit's invoice per
 * migration 010). The payment_completed notification is created by the
 * blokmate_notify_invoice_paid trigger (migration 008) when the invoice
 * update lands, not by this function directly.
 */
export async function completeMockPayment(
  invoice: Pick<Invoice, "id" | "amount_cents">,
  method: "bank_transfer" | "card" | "cash" | "other" = "card"
): Promise<void> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");
  const claims = await getBlokmateSessionClaims();
  if (!claims) {
    throw new Error("Tenant bilgisi bulunamadı — oturumun süresi dolmuş olabilir. Lütfen tekrar giriş yapın.");
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    amount_cents: invoice.amount_cents,
    method,
    tenant_id: claims.tenant_id,
    reference: `mock_${Date.now()}`,
  });
  if (paymentError) throw new Error(paymentError.message);

  const { error: invoiceError } = await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
  if (invoiceError) {
    throw new Error(`Ödeme kaydedildi ancak fatura durumu güncellenemedi: ${invoiceError.message}`);
  }
}
