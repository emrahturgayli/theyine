"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { listBuildings, listUnits, type Building, type Unit } from "@/lib/blokmate-data";
import {
  listInviteTokens,
  createInviteToken,
  revokeInviteToken,
  listPendingSignupRequests,
  approveSignupRequest,
  rejectSignupRequest,
  type InviteToken,
  type ResidentSignupRequest,
} from "@/lib/blokmate-invites";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord } from "@/lib/blokmate-terms";

/** Manager-only: create invite links and review/approve pending resident signup requests. */
export default function InvitesPage() {
  const router = useRouter();
  const { claims, loading: authLoading } = useBlokmateAuth();
  const { lang } = useBlokmateLanguage();
  const toast = useBlokmateToast();
  const isManager = claims?.role === "manager" || claims?.role === "staff";

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [requests, setRequests] = useState<ResidentSignupRequest[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [buildingId, setBuildingId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [creating, setCreating] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [unitPickForRequest, setUnitPickForRequest] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && claims && !isManager) {
      router.replace("/blokmate/dashboard");
    }
  }, [authLoading, claims, isManager, router]);

  async function load() {
    try {
      const [b, u, i, r] = await Promise.all([
        listBuildings(),
        listUnits(),
        listInviteTokens(),
        listPendingSignupRequests(),
      ]);
      setBuildings(b);
      setUnits(u);
      setInvites(i);
      setRequests(r);
      if (!buildingId && b.length > 0) setBuildingId(b[0].id);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!isManager) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createInviteToken({ building_id: buildingId, unit_id: unitId || undefined });
      setUnitId("");
      await load();
      toast.success("Davet linki oluşturuldu.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Bu daveti iptal etmek istediğine emin misin?")) return;
    try {
      await revokeInviteToken(id);
      await load();
      toast.success("Davet iptal edildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  async function handleApprove(request: ResidentSignupRequest) {
    setReviewingId(request.id);
    try {
      await approveSignupRequest(request, unitPickForRequest[request.id]);
      await load();
      toast.success(`${request.full_name} onaylandı.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject(request: ResidentSignupRequest) {
    if (!window.confirm(`${request.full_name} adlı talebi reddetmek istediğine emin misin?`)) return;
    setReviewingId(request.id);
    try {
      await rejectSignupRequest(request.id);
      await load();
      toast.success("Talep reddedildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setReviewingId(null);
    }
  }

  function buildingName(id: string) {
    return buildings.find((b) => b.id === id)?.name ?? id;
  }

  function unitLabel(id: string | null) {
    if (!id) return "—";
    return units.find((u) => u.id === id)?.label ?? id;
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/blokmate/invite/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link kopyalandı."),
      () => toast.error("Link kopyalanamadı — manuel kopyala: " + url)
    );
  }

  if (!isManager) return null;

  const unitsForBuilding = units.filter((u) => u.building_id === buildingId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Davetler</h1>

      <form onSubmit={handleCreate} className="card flex flex-wrap items-end gap-3 p-4">
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
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">Daire (opsiyonel)</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          >
            <option value="">Bina geneli (daire belirtilmedi)</option>
            {unitsForBuilding.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={creating || buildings.length === 0}
          className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {creating ? "Oluşturuluyor…" : "Davet oluştur"}
        </button>
      </form>

      {status === "error" && <p className="text-sm text-red-600">Veri alınamadı.</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">{buildingWord(lang)}</th>
              <th className="px-4 py-3">Daire</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {status === "loading" && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
              </tr>
            )}
            {status === "ready" && invites.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">Henüz davet oluşturulmadı.</td>
              </tr>
            )}
            {invites.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-medium text-ink">{buildingName(inv.building_id)}</td>
                <td className="px-4 py-3 text-ink-soft">{unitLabel(inv.unit_id)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      inv.status === "active"
                        ? "bg-green-50 text-green-700 dark:bg-green-950/50"
                        : "bg-mist text-ink-faint"
                    }`}
                  >
                    {inv.status === "active" ? "Aktif" : "İptal edildi"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {inv.status === "active" && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyLink(inv.token)}
                          className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-blue-500 hover:text-blue-600"
                        >
                          Linki kopyala
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-red-500 hover:text-red-600"
                        >
                          İptal et
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Onay Bekleyen Sakinler</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">{buildingWord(lang)}</th>
                <th className="px-4 py-3">Daire</th>
                <th className="px-4 py-3">Statü</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {status === "ready" && requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-faint">Bekleyen talep yok.</td>
                </tr>
              )}
              {requests.map((r) => {
                const requestUnits = units.filter((u) => u.building_id === r.building_id);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-ink">{r.full_name}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.email}</td>
                    <td className="px-4 py-3 text-ink-soft">{buildingName(r.building_id)}</td>
                    <td className="px-4 py-3">
                      {r.unit_id ? (
                        unitLabel(r.unit_id)
                      ) : (
                        <select
                          value={unitPickForRequest[r.id] ?? ""}
                          onChange={(e) => setUnitPickForRequest((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-blue-500"
                        >
                          <option value="">Daire seç…</option>
                          {requestUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.resident_status === "owner" ? "Mülk Sahibi" : r.resident_status === "tenant" ? "Kiracı" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(r)}
                          disabled={reviewingId === r.id || (!r.unit_id && !unitPickForRequest[r.id])}
                          className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-green-500 hover:text-green-600 disabled:opacity-60"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(r)}
                          disabled={reviewingId === r.id}
                          className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-red-500 hover:text-red-600 disabled:opacity-60"
                        >
                          Reddet
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
