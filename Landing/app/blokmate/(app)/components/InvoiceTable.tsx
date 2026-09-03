"use client";

import type { Invoice } from "@/lib/blokmate-data";

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
}: {
  invoices: Invoice[];
  loading: boolean;
  unitLabel: (unitId: string) => string;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Daire</th>
            <th className="px-4 py-3">Tutar</th>
            <th className="px-4 py-3">Son ödeme</th>
            <th className="px-4 py-3">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && invoices.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Kayıt yok.</td>
            </tr>
          )}
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="px-4 py-3 font-medium text-ink">{unitLabel(inv.unit_id)}</td>
              <td className="px-4 py-3 text-ink-soft">
                {(inv.amount_cents / 100).toFixed(2)} {inv.currency}
              </td>
              <td className="px-4 py-3 text-ink-soft">{inv.due_date}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[inv.status]}`}>
                  {STATUS_LABELS[inv.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
