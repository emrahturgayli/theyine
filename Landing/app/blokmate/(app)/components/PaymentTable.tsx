"use client";

import type { Payment, TenantSettings } from "@/lib/blokmate-data";
import { formatBlokmateAmount } from "@/lib/blokmate-currency";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";

export default function PaymentTable({
  payments,
  loading,
  unitLabel,
  currency,
}: {
  payments: Payment[];
  loading: boolean;
  /** Resolves a payment's invoice_id to a "Daire" label — undefined on the resident view, which has no reason to disambiguate its own unit. */
  unitLabel?: (invoiceId: string) => string;
  currency?: TenantSettings["currency"];
}) {
  const { lang } = useBlokmateLanguage();
  const showUnit = !!unitLabel;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Tarih</th>
            {showUnit && <th className="px-4 py-3">Daire</th>}
            <th className="px-4 py-3">Tutar</th>
            <th className="px-4 py-3">Yöntem</th>
            <th className="px-4 py-3">Referans</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={showUnit ? 5 : 4} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && payments.length === 0 && (
            <tr>
              <td colSpan={showUnit ? 5 : 4} className="px-4 py-6 text-center text-ink-faint">Henüz ödeme yok.</td>
            </tr>
          )}
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 text-ink-soft">{new Date(p.paid_at).toLocaleDateString("tr-TR")}</td>
              {showUnit && <td className="px-4 py-3 text-ink-soft">{unitLabel!(p.invoice_id)}</td>}
              <td className="px-4 py-3 font-medium text-ink">{formatBlokmateAmount(p.amount_cents, lang, currency)}</td>
              <td className="px-4 py-3 text-ink-soft">{p.method}</td>
              <td className="px-4 py-3 text-ink-faint">{p.reference ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
