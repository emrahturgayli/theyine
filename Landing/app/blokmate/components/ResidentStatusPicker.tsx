"use client";

import type { ResidentStatus } from "@/lib/blokmate-invites";

/** Owner/tenant toggle shared by both resident signup surfaces (register page's dropdown/code flow and the invite-link page). */
export default function ResidentStatusPicker({
  value,
  onChange,
}: {
  value: ResidentStatus;
  onChange: (next: ResidentStatus) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink">Statün</label>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("owner")}
          className={`min-h-[44px] rounded-lg border px-3 text-sm font-semibold transition ${
            value === "owner"
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40"
              : "border-line text-ink-soft hover:border-blue-500"
          }`}
        >
          Mülk Sahibi
        </button>
        <button
          type="button"
          onClick={() => onChange("tenant")}
          className={`min-h-[44px] rounded-lg border px-3 text-sm font-semibold transition ${
            value === "tenant"
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40"
              : "border-line text-ink-soft hover:border-blue-500"
          }`}
        >
          Kiracı
        </button>
      </div>
    </div>
  );
}
