"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  listCommentsForAnnouncement,
  listCommentsForTicket,
  createComment,
  type Comment,
} from "@/lib/blokmate-data";
import { useBlokmateToast } from "@/lib/blokmate-toast";

/**
 * Inline comment thread for one announcement or one ticket — pass exactly
 * one of announcementId/ticketId. `canPost` is a UI-only hint (hide the
 * composer for a resident on someone else's ticket, say); the actual
 * write gate is comments_insert in
 * supabase/migrations/007_add_comments_and_resident_scoping.sql, so a
 * caller with canPost=true whose insert isn't actually allowed still just
 * gets a rejected-request error toast, not a security hole.
 */
export default function CommentThread({
  buildingId,
  announcementId,
  ticketId,
  canPost = true,
}: {
  buildingId: string;
  announcementId?: string;
  ticketId?: string;
  canPost?: boolean;
}) {
  const toast = useBlokmateToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = announcementId
        ? await listCommentsForAnnouncement(announcementId)
        : await listCommentsForTicket(ticketId!);
      setComments(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId, ticketId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await createComment({ building_id: buildingId, announcement_id: announcementId, ticket_id: ticketId, message });
      setMessage("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yorum gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {status === "loading" && <p className="text-xs text-ink-faint">Yorumlar yükleniyor…</p>}
      {status === "error" && <p className="text-xs text-red-600">Yorumlar alınamadı.</p>}
      {status === "ready" && comments.length === 0 && (
        <p className="text-xs text-ink-faint">Henüz yorum yok.</p>
      )}
      {status === "ready" && comments.length > 0 && (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-mist px-3 py-2 text-xs">
              <div className="text-ink-faint">{new Date(c.created_at).toLocaleString("tr-TR")}</div>
              <p className="mt-0.5 text-ink-soft">{c.message}</p>
            </li>
          ))}
        </ul>
      )}
      {canPost && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bir yorum yaz…"
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="min-h-[32px] rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "…" : "Gönder"}
          </button>
        </form>
      )}
    </div>
  );
}
