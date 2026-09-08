"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Global "Bina Seç" filter state, held in the URL (?building=id) rather
 * than component state, so it survives navigating between
 * Dashboard/Units/Invoices/Announcements/Payments/Tickets — each page
 * reads the same query param independently via this hook instead of the
 * selection being lifted into a shared React context.
 */
export function useBuildingFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const buildingId = searchParams.get("building") ?? "";

  const setBuildingId = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("building", id);
      else params.delete("building");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [searchParams, pathname, router]
  );

  return { buildingId, setBuildingId };
}
