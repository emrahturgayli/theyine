"use client";

import { useEffect, useState } from "react";
import { listNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from "@/lib/blokmate-data";
import { useBlokmateToast } from "@/lib/blokmate-toast";

const TYPE_LABELS: Record<Notification["type"], string> = {
  announcement_published: "Yeni duyuru yayınlandı",
  invoice_issued: "Yeni aidat kesildi",
  ticket_updated: "Talebinde güncelleme var",
  payment_completed: "Ödemen alındı",
};

export default function NotificationsPage() {
  const toast = useBlokmateToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    try {
      setNotifications(await listNotifications());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(n: Notification) {
    const next = !n.is_read;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: next } : x)));
    try {
      await markNotificationRead(n.id, next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
      await load();
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Bildirimler</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="min-h-[36px] rounded-lg border border-line px-3 text-xs font-semibold text-ink-soft hover:border-blue-500 hover:text-blue-600"
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      {status === "error" && <p className="text-sm text-red-600">Bildirimler alınamadı.</p>}

      <div className="card overflow-hidden">
        {status === "loading" && <p className="p-6 text-center text-sm text-ink-faint">Yükleniyor…</p>}
        {status === "ready" && notifications.length === 0 && (
          <p className="p-6 text-center text-sm text-ink-faint">Henüz bildirim yok.</p>
        )}
        <ul className="divide-y divide-line">
          {notifications.map((n) => (
            <li key={n.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${n.is_read ? "" : "bg-blue-50/50 dark:bg-blue-950/20"}`}>
              <div>
                <p className={`text-sm ${n.is_read ? "text-ink-soft" : "font-semibold text-ink"}`}>{TYPE_LABELS[n.type]}</p>
                <p className="text-xs text-ink-faint">{new Date(n.created_at).toLocaleString("tr-TR")}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(n)}
                className="min-h-[32px] shrink-0 rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-blue-500 hover:text-blue-600"
              >
                {n.is_read ? "Okunmadı yap" : "Okundu işaretle"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
