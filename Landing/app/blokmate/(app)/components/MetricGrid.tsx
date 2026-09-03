"use client";

import type { ReactNode } from "react";

/** Responsive card grid — 1 col mobile, 2 sm, 3 lg, matching the rest of the dashboard's spacing. */
export default function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
