"use client";

import { getBlokmateSupabaseBrowser } from "@/lib/blokmate-supabase-browser";
import type { Invoice } from "@/lib/blokmate-data";

/**
 * Client-side entry point for the real Stripe Checkout flow
 * (app/api/payments/create-session, app/api/payments/webhook). Replaces
 * the Phase-4 mock, which inserted a payment row and flipped the invoice
 * to "paid" directly from the browser — that write path no longer exists:
 * migration 013 revoked the resident-writable RLS grant that made it
 * possible, and invoice status now only ever changes server-side, after
 * Stripe confirms the charge via a signature-verified webhook event.
 *
 * This function does the network call itself rather than returning a
 * plain object the caller posts elsewhere (Phase 4's startPaymentSession
 * shape), since there's now a real request in the critical path — the
 * caller just needs the redirect URL.
 */
export async function startCheckout(invoice: Pick<Invoice, "id">): Promise<string> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Oturum bulunamadı — lütfen tekrar giriş yapın.");

  const res = await fetch("/api/payments/create-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ invoice_id: invoice.id }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Ödeme başlatılamadı.");
  if (!data.url) throw new Error("Ödeme sayfası alınamadı.");
  return data.url as string;
}
