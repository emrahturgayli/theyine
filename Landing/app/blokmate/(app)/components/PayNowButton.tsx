"use client";

import { useState } from "react";
import type { Invoice, TenantSettings } from "@/lib/blokmate-data";
import { startPaymentSession, completeMockPayment } from "@/lib/blokmate-payments";
import { formatBlokmateAmount } from "@/lib/blokmate-currency";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import Modal from "./Modal";

/** "Öde" button + mock checkout modal — see lib/blokmate-payments.ts for the gateway abstraction this drives. */
export default function PayNowButton({
  invoice,
  onPaid,
  currency,
}: {
  invoice: Pick<Invoice, "id" | "amount_cents" | "currency">;
  onPaid?: () => void | Promise<void>;
  currency?: TenantSettings["currency"];
}) {
  const { lang } = useBlokmateLanguage();
  const toast = useBlokmateToast();
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  function handleOpen() {
    startPaymentSession(invoice);
    setOpen(true);
  }

  async function handleConfirm() {
    setPaying(true);
    try {
      await completeMockPayment(invoice);
      toast.success("Ödeme alındı.");
      setOpen(false);
      await onPaid?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ödeme başarısız oldu.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="min-h-[32px] rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Öde
      </button>
      {open && (
        <Modal title="Ödeme" onClose={() => (!paying ? setOpen(false) : undefined)}>
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">{formatBlokmateAmount(invoice.amount_cents, lang, currency)}</span>{" "}
              tutarındaki aidatı ödemek üzeresin.
            </p>
            <p className="text-xs text-ink-faint">
              Bu bir deneme (sandbox) ödeme akışıdır — gerçek bir kart işlemi gerçekleşmez.
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={paying}
              className="btn w-full min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {paying ? "İşleniyor…" : "Ödemeyi onayla"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
