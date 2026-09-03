"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listBuildings, createBuilding, type Building } from "@/lib/blokmate-data";
import BuildingList from "../components/BuildingList";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setBuildings(await listBuildings());
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBuilding({ name, address: address || undefined });
      setName("");
      setAddress("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Binalar</h1>

      <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">Bina adı</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">Adres</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {submitting ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <BuildingList buildings={buildings} loading={status === "loading"} />
    </div>
  );
}
