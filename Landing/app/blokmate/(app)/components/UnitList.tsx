"use client";

import type { Unit } from "@/lib/blokmate-data";

export default function UnitList({
  units,
  loading,
  buildingName,
}: {
  units: Unit[];
  loading: boolean;
  buildingName: (buildingId: string) => string;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Daire</th>
            <th className="px-4 py-3">Bina</th>
            <th className="px-4 py-3">Malik</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && units.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">Henüz daire eklenmedi.</td>
            </tr>
          )}
          {units.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium text-ink">{u.label}</td>
              <td className="px-4 py-3 text-ink-soft">{buildingName(u.building_id)}</td>
              <td className="px-4 py-3 text-ink-soft">{u.owner_name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
