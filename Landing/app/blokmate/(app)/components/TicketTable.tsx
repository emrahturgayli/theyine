"use client";

import { Fragment, useState } from "react";
import type { Ticket } from "@/lib/blokmate-data";
import CommentThread from "./CommentThread";

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

export default function TicketTable({
  tickets,
  loading,
  canManage = false,
  currentUserId,
}: {
  tickets: Ticket[];
  loading: boolean;
  /** Managers/staff can comment on any ticket; a resident only on one they filed themselves. */
  canManage?: boolean;
  currentUserId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Konu</th>
            <th className="px-4 py-3">Tarih</th>
            <th className="px-4 py-3">Durum</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Henüz talep yok.</td>
            </tr>
          )}
          {tickets.map((t) => (
            <Fragment key={t.id}>
              <tr>
                <td className="px-4 py-3 font-medium text-ink">{t.subject}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(t.created_at).toLocaleDateString("tr-TR")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === t.id ? null : t.id)}
                    className="min-h-[28px] rounded-md border border-line px-2 text-xs font-semibold text-ink-soft transition-colors hover:border-blue-500 hover:text-blue-600"
                  >
                    Yorumlar
                  </button>
                </td>
              </tr>
              {openId === t.id && (
                <tr>
                  <td colSpan={4} className="bg-mist/40 px-4 py-3">
                    <CommentThread
                      buildingId={t.building_id}
                      ticketId={t.id}
                      canPost={canManage || currentUserId === t.reported_by_user_id}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
