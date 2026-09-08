"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listAnnouncements, createAnnouncement, deleteAnnouncement, listBuildings, sendBroadcastNotification, type Announcement, type Building } from "@/lib/blokmate-data";
import { uploadBlokmateAttachment } from "@/lib/blokmate-attachments";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import AnnouncementList from "../components/AnnouncementList";
import BuildingFilterBar from "../components/BuildingFilterBar";
import { useBuildingFilter } from "../components/useBuildingFilter";

export default function AnnouncementsPage() {
  const { claims } = useBlokmateAuth();
  const canManage = claims?.role === "manager" || claims?.role === "staff";
  const toast = useBlokmateToast();
  const { buildingId: filterBuildingId } = useBuildingFilter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [broadcastBuildingId, setBroadcastBuildingId] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  async function load() {
    try {
      const [a, b] = await Promise.all([listAnnouncements(filterBuildingId || undefined), listBuildings()]);
      setAnnouncements(a);
      setBuildings(b);
      if (!buildingId && b.length > 0) {
        setBuildingId(b[0].id);
        setBroadcastBuildingId(b[0].id);
      }
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBuildingId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const attachment_url = file ? await uploadBlokmateAttachment("announcements", file) : undefined;
      await createAnnouncement({ building_id: buildingId, title, body, attachment_url });
      setTitle("");
      setBody("");
      setFile(null);
      await load();
      toast.success("Duyuru yayınlandı.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(message);
      setStatus("error");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(announcement: Announcement) {
    if (!window.confirm("Bu duyuruyu silmek istediğine emin misin? Bu işlem geri alınamaz.")) return;
    try {
      await deleteAnnouncement(announcement.id);
      await load();
      toast.success("Duyuru silindi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  async function handleBroadcast(e: FormEvent) {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const count = await sendBroadcastNotification({ building_id: broadcastBuildingId, message: broadcastMessage });
      setBroadcastMessage("");
      toast.success(`${count} sakine bildirim gönderildi.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Duyurular</h1>
        <BuildingFilterBar buildings={buildings} />
      </div>

      {canManage && (
      <form onSubmit={handleSubmit} className="card space-y-3 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-ink-faint">Bina</label>
            <select
              required
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-ink-faint">Başlık</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-faint">İçerik</label>
          <textarea
            required
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-faint">Dosya ekle (opsiyonel)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:min-h-[32px] file:rounded-md file:border-0 file:bg-mist file:px-3 file:text-xs file:font-semibold file:text-ink-soft"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || buildings.length === 0}
          className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Yayınlanıyor…" : "Yayınla"}
        </button>
      </form>
      )}

      {canManage && (
        <form onSubmit={handleBroadcast} className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold text-ink">Toplu Bildirim Gönder</h2>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[160px]">
              <label className="text-xs font-medium text-ink-faint">Bina</label>
              <select
                required
                value={broadcastBuildingId}
                onChange={(e) => setBroadcastBuildingId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-ink-faint">Mesaj</label>
              <input
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Örn: Yarın su kesintisi olacaktır."
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={broadcasting || buildings.length === 0}
            className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {broadcasting ? "Gönderiliyor…" : "Bildirim gönder"}
          </button>
        </form>
      )}

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <AnnouncementList
        announcements={announcements}
        loading={status === "loading"}
        canManage={canManage}
        onDelete={handleDelete}
        showComments
      />
    </div>
  );
}
