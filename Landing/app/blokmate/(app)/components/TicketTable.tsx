"use client";

import type { Ticket } from "@/lib/blokmate-data";

const STATUS_LABELS: Record<Ticket["status"], string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
  closed: "Kapalı",
};

const STATUS_STYLES: Record<Ticket["status"], string> = {
  open: "bg-red-50 text-red-600 dark:bg-red-950/50",
  in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-950/50",
  resolved: "bg-green-50 text-green-700 dark:bg-green-950/50",
  closed: "bg-mist text-ink-faint",
};

export default function TicketTable({ tickets, loading }: { tickets: Ticket[]; loading: boolean }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Konu</th>
            <th className="px-4 py-3">Tarih</th>
            <th className="px-4 py-3">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">Henüz talep yok.</td>
            </tr>
          )}
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-3 font-medium text-ink">{t.subject}</td>
              <td className="px-4 py-3 text-ink-soft">{new Date(t.created_at).toLocaleDateString("tr-TR")}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[t.status]}`}>
                  {STATUS_LABELS[t.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
