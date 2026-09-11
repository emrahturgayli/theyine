"use client";

import { useState } from "react";
import type { Invoice, TenantSettings, ManualPaymentMethod } from "@/lib/blokmate-data";
import { formatBlokmateAmount } from "@/lib/blokmate-currency";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import PayNowButton from "./PayNowButton";
import MarkPaidButton from "./MarkPaidButton";

const STATUS_LABELS: Record<Invoice["status"], string> = {
  unpaid: "Ödenmedi",
  paid: "Ödendi",
  overdue: "Gecikmiş",
  void: "İptal",
};

const STATUS_STYLES: Record<Invoice["status"], string> = {
  unpaid: "bg-amber-50 text-amber-700 dark:bg-amber-950/50",
  paid: "bg-green-50 text-green-700 dark:bg-green-950/50",
  overdue: "bg-red-50 text-red-600 dark:bg-red-950/50",
  void: "bg-mist text-ink-faint",
};

export default function InvoiceTable({
  invoices,
  loading,
  unitLabel,
  canManage = false,
  onMarkPaid,
  onMarkUnpaid,
  onDelete,
  showPayButton = false,
  currency,
}: {
  invoices: Invoice[];
  loading: boolean;
  unitLabel: (unitId: string) => string;
  /** Manager/accountant only — RLS enforces this server-side regardless, this just hides the button for residents. */
  canManage?: boolean;
  onMarkPaid?: (invoice: Invoice, method: ManualPaymentMethod) => Promise<void>;
  /** Manager/accountant only — reverses a mistaken/fraudulent "paid" back to "unpaid" (migration 012). */
  onMarkUnpaid?: (invoice: Invoice) => Promise<void>;
  onDelete?: (invoice: Invoice) => void;
  /** Resident self-service "Öde" button — redirects to Stripe Checkout, see lib/blokmate-payments.ts. */
  showPayButton?: boolean;
  currency?: TenantSettings["currency"];
}) {
  const [markingId, setMarkingId] = useState<string | null>(null);
  const { lang } = useBlokmateLanguage();

  async function handleMarkPaid(inv: Invoice, method: ManualPaymentMethod) {
    if (!onMarkPaid || markingId) return;
    setMarkingId(inv.id);
    try {
      await onMarkPaid(inv, method);
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkUnpaid(inv: Invoice) {
    if (!onMarkUnpaid || markingId) return;
    setMarkingId(inv.id);
    try {
      await onMarkUnpaid(inv);
    } finally {
      setMarkingId(null);
    }
  }

  const columnCount = 6 + (canManage || showPayButton ? 1 : 0);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Daire</th>
            <th className="px-4 py-3">Dönem</th>
            <th className="px-4 py-3">Tutar</th>
            <th className="px-4 py-3">Son ödeme</th>
            <th className="px-4 py-3">Durum</th>
            <th className="px-4 py-3">Ödeme tarihi</th>
            {(canManage || showPayButton) && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={columnCount} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && invoices.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-4 py-6 text-center text-ink-faint">Kayıt yok.</td>
            </tr>
          )}
          {invoices.map((inv) => {
            const payable = inv.status === "unpaid" || inv.status === "overdue";
            return (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-medium text-ink">{unitLabel(inv.unit_id)}</td>
                <td className="px-4 py-3 text-ink-soft">{inv.period ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{formatBlokmateAmount(inv.amount_cents, lang, currency)}</td>
                <td className="px-4 py-3 text-ink-soft">{inv.due_date}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("tr-TR") : "—"}
                </td>
                {(canManage || showPayButton) && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {payable && showPayButton && (
                        <PayNowButton invoice={inv} />
                      )}
                      {payable && onMarkPaid && (
                        <MarkPaidButton onConfirm={(method) => handleMarkPaid(inv, method)} />
                      )}
                      {inv.status === "paid" && onMarkUnpaid && (
                        <button
                          type="button"
                          onClick={() => handleMarkUnpaid(inv)}
                          disabled={markingId === inv.id}
                          className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-amber-500 hover:text-amber-600 disabled:opacity-60"
                        >
                          {markingId === inv.id ? "İşleniyor…" : "Ödenmedi Yap"}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(inv)}
                          className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-red-500 hover:text-red-600"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
