"use client";

import type { Unit } from "@/lib/blokmate-data";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord } from "@/lib/blokmate-terms";

export default function UnitList({
  units,
  loading,
  buildingName,
  canManage = false,
  onEdit,
  onDelete,
}: {
  units: Unit[];
  loading: boolean;
  buildingName: (buildingId: string) => string;
  canManage?: boolean;
  onEdit?: (unit: Unit) => void;
  onDelete?: (unit: Unit) => void;
}) {
  const { lang } = useBlokmateLanguage();
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Daire</th>
            <th className="px-4 py-3">{buildingWord(lang)}</th>
            <th className="px-4 py-3">Malik</th>
            {canManage && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && (
            <tr>
              <td colSpan={canManage ? 4 : 3} className="px-4 py-6 text-center text-ink-faint">Yükleniyor…</td>
            </tr>
          )}
          {!loading && units.length === 0 && (
            <tr>
              <td colSpan={canManage ? 4 : 3} className="px-4 py-6 text-center text-ink-faint">Henüz daire eklenmedi.</td>
            </tr>
          )}
          {units.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium text-ink">{u.label}</td>
              <td className="px-4 py-3 text-ink-soft">{buildingName(u.building_id)}</td>
              <td className="px-4 py-3 text-ink-soft">{u.owner_name ?? "—"}</td>
              {canManage && (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(u)}
                        className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-blue-500 hover:text-blue-600"
                      >
                        Düzenle
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(u)}
                        className="min-h-[32px] rounded-md border border-line px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-red-500 hover:text-red-600"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
