"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listUnits, createUnit, updateUnit, deleteUnit, listBuildings, type Unit, type Building } from "@/lib/blokmate-data";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord } from "@/lib/blokmate-terms";
import UnitList from "../components/UnitList";
import Modal from "../components/Modal";

export default function UnitsPage() {
  const { claims } = useBlokmateAuth();
  const { lang } = useBlokmateLanguage();
  const toast = useBlokmateToast();
  const canManage = claims?.role === "manager" || claims?.role === "accountant";

  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState("");
  const [label, setLabel] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Unit | null>(null);
  const [editBuildingId, setEditBuildingId] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

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
      toast.success("Daire eklendi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(message);
      setStatus("error");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(unit: Unit) {
    setEditing(unit);
    setEditBuildingId(unit.building_id);
    setEditLabel(unit.label);
    setEditOwnerName(unit.owner_name ?? "");
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditSubmitting(true);
    try {
      await updateUnit(editing.id, { building_id: editBuildingId, label: editLabel, owner_name: editOwnerName || undefined });
      setEditing(null);
      await load();
      toast.success("Daire güncellendi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(unit: Unit) {
    if (!window.confirm(`"${unit.label}" dairesini silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    try {
      await deleteUnit(unit.id);
      await load();
      toast.success("Daire silindi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  function buildingName(id: string) {
    return buildings.find((b) => b.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Daireler</h1>

      {canManage && (
      <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">{buildingWord(lang)}</label>
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
      )}

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      {canManage && status === "ready" && buildings.length === 0 && (
        <p className="text-sm text-ink-faint">Önce bir {buildingWord(lang).toLowerCase()} eklemelisin.</p>
      )}

      <UnitList
        units={units}
        loading={status === "loading"}
        buildingName={buildingName}
        canManage={canManage}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {editing && (
        <Modal title="Daireyi düzenle" onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">{buildingWord(lang)}</label>
              <select
                required
                value={editBuildingId}
                onChange={(e) => setEditBuildingId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Daire no</label>
              <input
                required
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Malik</label>
              <input
                value={editOwnerName}
                onChange={(e) => setEditOwnerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={editSubmitting}
              className="btn w-full min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {editSubmitting ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
