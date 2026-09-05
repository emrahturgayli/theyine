"use client";

import type { Announcement } from "@/lib/blokmate-data";

export default function AnnouncementList({
  announcements,
  loading,
  limit,
  canManage = false,
  onDelete,
}: {
  announcements: Announcement[];
  loading: boolean;
  limit?: number;
  canManage?: boolean;
  onDelete?: (announcement: Announcement) => void;
}) {
  const items = limit ? announcements.slice(0, limit) : announcements;

  if (loading) return <p className="text-sm text-ink-faint">Yükleniyor…</p>;
  if (items.length === 0) return <p className="text-sm text-ink-faint">Henüz duyuru yok.</p>;

  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className={limit ? undefined : "card p-4"}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-faint">{new Date(a.published_at).toLocaleDateString("tr-TR")}</span>
              {canManage && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(a)}
                  className="min-h-[28px] rounded-md border border-line px-2 text-xs font-semibold text-ink-soft transition-colors hover:border-red-500 hover:text-red-600"
                >
                  Sil
                </button>
              )}
            </div>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
