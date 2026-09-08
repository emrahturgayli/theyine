"use client";

import type { Building } from "@/lib/blokmate-data";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord } from "@/lib/blokmate-terms";
import { useBuildingFilter } from "./useBuildingFilter";

/** Global building-scope dropdown — see useBuildingFilter for how the selection persists across pages via the URL. */
export default function BuildingFilterBar({ buildings }: { buildings: Building[] }) {
  const { lang } = useBlokmateLanguage();
  const { buildingId, setBuildingId } = useBuildingFilter();

  if (buildings.length < 2) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-ink-faint">{buildingWord(lang)} seç</label>
      <select
        value={buildingId}
        onChange={(e) => setBuildingId(e.target.value)}
        className="min-h-[36px] rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-blue-500"
      >
        <option value="">Tümü</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
