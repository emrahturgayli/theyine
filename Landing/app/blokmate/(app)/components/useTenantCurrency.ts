"use client";

import { useEffect, useState } from "react";
import { getTenantSettings, type TenantSettings } from "@/lib/blokmate-data";

/**
 * Tenant-wide currency override (Ayarlar -> Para birimi), or undefined
 * while loading / if unset — callers pass this straight through to
 * formatBlokmateAmount()'s tenantCurrency param, which falls back to the
 * locale-forced default (see lib/blokmate-currency.ts) when this is
 * undefined/null. Fetched once per page mount rather than lifted into a
 * context, since only a handful of pages show money at all.
 */
export function useTenantCurrency(): TenantSettings["currency"] | undefined {
  const [currency, setCurrency] = useState<TenantSettings["currency"] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getTenantSettings();
        if (!cancelled) setCurrency(settings?.currency ?? null);
      } catch {
        if (!cancelled) setCurrency(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return currency;
}
