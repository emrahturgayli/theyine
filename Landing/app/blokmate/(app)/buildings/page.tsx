"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listBuildings, createBuilding, updateBuilding, deleteBuilding, type Building } from "@/lib/blokmate-data";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord, buildingWordPlural } from "@/lib/blokmate-terms";
import BuildingList from "../components/BuildingList";
import Modal from "../components/Modal";

export default function BuildingsPage() {
  const { claims } = useBlokmateAuth();
  const { lang } = useBlokmateLanguage();
  const toast = useBlokmateToast();
  const canManage = claims?.role === "manager" || claims?.role === "accountant";

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [standardDue, setStandardDue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Building | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStandardDue, setEditStandardDue] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

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
      await createBuilding({
        name,
        address: address || undefined,
        standard_due_amount_cents: standardDue ? Math.round(Number(standardDue) * 100) : undefined,
      });
      setName("");
      setAddress("");
      setStandardDue("");
      await load();
      toast.success(`${buildingWord(lang)} eklendi.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(message);
      setStatus("error");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(building: Building) {
    setEditing(building);
    setEditName(building.name);
    setEditAddress(building.address ?? "");
    setEditStandardDue(
      building.standard_due_amount_cents != null ? (building.standard_due_amount_cents / 100).toString() : ""
    );
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditSubmitting(true);
    try {
      await updateBuilding(editing.id, {
        name: editName,
        address: editAddress || undefined,
        standard_due_amount_cents: editStandardDue ? Math.round(Number(editStandardDue) * 100) : null,
      });
      setEditing(null);
      await load();
      toast.success(`${buildingWord(lang)} güncellendi.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(building: Building) {
    if (!window.confirm(`"${building.name}" binasını silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    try {
      await deleteBuilding(building.id);
      await load();
      toast.success(`${buildingWord(lang)} silindi.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">{buildingWordPlural(lang)}</h1>

      {canManage && (
      <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">{buildingWord(lang)} adı</label>
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
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">Standart Aidat Tutarı</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={standardDue}
            onChange={(e) => setStandardDue(e.target.value)}
            placeholder="opsiyonel"
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {submitting ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>
      )}

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <BuildingList
        buildings={buildings}
        loading={status === "loading"}
        canManage={canManage}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {editing && (
        <Modal title={`${buildingWord(lang)} düzenle`} onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">{buildingWord(lang)} adı</label>
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Adres</label>
              <input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Standart Aidat Tutarı</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editStandardDue}
                onChange={(e) => setEditStandardDue(e.target.value)}
                placeholder="opsiyonel"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-ink-faint">
                "Aylık Aidatları Tahakkuk Et" butonu bu tutarı kullanır.
              </p>
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
