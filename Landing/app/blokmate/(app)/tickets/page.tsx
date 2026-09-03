"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listTickets, createTicket, listBuildings, type Ticket, type Building } from "@/lib/blokmate-data";
import TicketTable from "../components/TicketTable";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [t, b] = await Promise.all([listTickets(), listBuildings()]);
      setTickets(t);
      setBuildings(b);
      if (!buildingId && b.length > 0) setBuildingId(b[0].id);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTicket({ building_id: buildingId, subject, body: body || undefined });
      setSubject("");
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Talepler</h1>

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
            <label className="text-xs font-medium text-ink-faint">Konu</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-faint">Açıklama</label>
          <textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || buildings.length === 0}
          className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Gönderiliyor…" : "Talep oluştur"}
        </button>
      </form>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <TicketTable tickets={tickets} loading={status === "loading"} />
    </div>
  );
}
