"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listNotifications, markNotificationRead, type Notification } from "@/lib/blokmate-data";

const TYPE_LABELS: Record<Notification["type"], string> = {
  announcement_published: "Yeni duyuru",
  invoice_issued: "Yeni aidat",
  ticket_updated: "Talep güncellendi",
  payment_completed: "Ödeme alındı",
  reminder_due: "Ödeme hatırlatması",
  broadcast_message: "Yönetimden mesaj",
};

/** Header bell — unread count + a short dropdown, full history lives at /blokmate/notifications. */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setNotifications(await listNotifications());
    } catch {
      // Silent — a broken bell shouldn't block the rest of the header.
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleOpen() {
    setOpen((o) => !o);
  }

  async function handleMarkRead(n: Notification) {
    if (n.is_read) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try {
      await markNotificationRead(n.id);
    } catch {
      await load();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Bildirimler"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-mist"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-[120] mt-2 w-80 rounded-xl border border-line bg-surface p-2 shadow-lift">
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-ink-faint">Henüz bildirim yok.</p>
            )}
            {notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleMarkRead(n)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-mist ${
                  n.is_read ? "text-ink-faint" : "font-semibold text-ink"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{TYPE_LABELS[n.type]}</span>
                  {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                </div>
                <span className="mt-0.5 block text-[10px] text-ink-faint">
                  {new Date(n.created_at).toLocaleString("tr-TR")}
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/blokmate/notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-3 py-2 text-center text-xs font-semibold text-blue-600 hover:bg-mist"
          >
            Tümünü gör
          </Link>
        </div>
      )}
    </div>
  );
}
