"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listUnits, createUnit, listBuildings, type Unit, type Building } from "@/lib/blokmate-data";
import UnitList from "../components/UnitList";

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState("");
  const [label, setLabel] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [u, b] = await Promise.all([listUnits(), listBuildings()]);
      setUnits(u);
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
      await createUnit({ building_id: buildingId, label, owner_name: ownerName || undefined });
      setLabel("");
      setOwnerName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setSubmitting(false);
    }
  }

  function buildingName(id: string) {
    return buildings.find((b) => b.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Daireler</h1>

      <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3 p-4">
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
        <div className="min-w-[120px]">
          <label className="text-xs font-medium text-ink-faint">Daire no</label>
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">Malik</label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || buildings.length === 0}
          className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      {status === "ready" && buildings.length === 0 && (
        <p className="text-sm text-ink-faint">Önce bir bina eklemelisin.</p>
      )}

      <UnitList units={units} loading={status === "loading"} buildingName={buildingName} />
    </div>
  );
}
