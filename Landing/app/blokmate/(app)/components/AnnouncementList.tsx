"use client";

import type { Announcement } from "@/lib/blokmate-data";

export default function AnnouncementList({
  announcements,
  loading,
  limit,
}: {
  announcements: Announcement[];
  loading: boolean;
  limit?: number;
}) {
  const items = limit ? announcements.slice(0, limit) : announcements;

  if (loading) return <p className="text-sm text-ink-faint">Yükleniyor…</p>;
  if (items.length === 0) return <p className="text-sm text-ink-faint">Henüz duyuru yok.</p>;

  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className={limit ? undefined : "card p-4"}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
            <span className="text-xs text-ink-faint">{new Date(a.published_at).toLocaleDateString("tr-TR")}</span>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
