"use client";

import type { Payment } from "@/lib/blokmate-data";

export default function PaymentTable({ payments, loading }: { payments: Payment[]; loading: boolean }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Tarih</th>
            <th className="px-4 py-3">Tutar</th>
            <th className="px-4 py-3">Yöntem</th>
            <th className="px-4 py-3">Referans</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && payments.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Henüz ödeme yok.</td>
            </tr>
          )}
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 text-ink-soft">{new Date(p.paid_at).toLocaleDateString("tr-TR")}</td>
              <td className="px-4 py-3 font-medium text-ink">{(p.amount_cents / 100).toFixed(2)}</td>
              <td className="px-4 py-3 text-ink-soft">{p.method}</td>
              <td className="px-4 py-3 text-ink-faint">{p.reference ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
