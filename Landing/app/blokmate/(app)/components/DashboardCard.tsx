"use client";

import type { ReactNode } from "react";

export default function DashboardCard({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "positive" | "warning" | "danger";
  hint?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-600"
      : tone === "warning"
      ? "text-amber-600"
      : tone === "danger"
      ? "text-red-600"
      : "text-ink";

  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}
