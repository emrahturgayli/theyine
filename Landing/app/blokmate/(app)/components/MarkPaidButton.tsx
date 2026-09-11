"use client";

import { useState } from "react";
import type { ManualPaymentMethod } from "@/lib/blokmate-data";
import Modal from "./Modal";

const METHODS: { value: ManualPaymentMethod; label: string }[] = [
  { value: "cash", label: "Elden Ödeme" },
  { value: "bank_transfer", label: "Havale" },
  { value: "door", label: "Kapıdan Ödeme" },
];

/**
 * Manager's manual payment-entry action — replaces a plain "mark paid"
 * button with a method picker, since SPEC.md's beta feedback distinguishes
 * Elden/Havale/Kapıdan as separate collection channels (payments.method,
 * migration 016 adds 'door') rather than defaulting everything to 'cash'.
 */
export default function MarkPaidButton({ onConfirm }: { onConfirm: (method: ManualPaymentMethod) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handlePick(method: ManualPaymentMethod) {
    setSubmitting(true);
    try {
      await onConfirm(method);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-green-500 hover:text-green-600"
      >
        Ödendi olarak işaretle
      </button>
      {open && (
        <Modal title="Ödeme yöntemi" onClose={() => (!submitting ? setOpen(false) : undefined)}>
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">Bu aidat nasıl tahsil edildi?</p>
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => handlePick(m.value)}
                disabled={submitting}
                className="btn w-full min-h-[44px] justify-start border border-line bg-transparent text-ink hover:border-blue-600 hover:text-blue-600 disabled:opacity-60"
              >
                {m.label}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
