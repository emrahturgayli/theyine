"use client";

import { useState } from "react";
import type { Invoice } from "@/lib/blokmate-data";
import { startCheckout } from "@/lib/blokmate-payments";
import { useBlokmateToast } from "@/lib/blokmate-toast";

/**
 * "Öde" button — starts a real Stripe Checkout session and redirects to
 * Stripe's hosted page (see lib/blokmate-payments.ts). No local
 * confirm-amount modal anymore: Stripe's own Checkout page already shows
 * the amount and asks for confirmation, so a BlokMate-side one would just
 * be a redundant extra click. The invoice only actually flips to "paid"
 * once Stripe's webhook confirms the charge (app/api/payments/webhook) —
 * the redirect back to /blokmate/invoices?payment=success is a UX
 * signal, not the write itself.
 */
export default function PayNowButton({ invoice }: { invoice: Pick<Invoice, "id"> }) {
  const toast = useBlokmateToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await startCheckout(invoice);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ödeme başlatılamadı.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="min-h-[32px] rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? "Yönlendiriliyor…" : "Öde"}
    </button>
  );
}
