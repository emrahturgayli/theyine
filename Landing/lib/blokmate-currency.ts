import type { BlokmateLanguage } from "@/hooks/useBlokmateLanguage";

/**
 * Bulgaria is transitioning to the euro, so the invoices.currency column
 * (default 'BGN', supabase/migrations/001_init_blokmate.sql) is no longer
 * a safe display value on its own. Display currency is resolved in this
 * priority order:
 *   1. tenant_settings.currency, if the manager has explicitly set one
 *      (supabase/migrations/009_add_tenant_settings.sql) — pass it as
 *      `tenantCurrency`.
 *   2. Otherwise, forced by the active UI locale: Turkish -> TRY,
 *      English/Bulgarian -> EUR. This is a hard requirement, not a
 *      loose default — never fall through to the raw invoices.currency
 *      ('BGN') value, which is what caused the earlier bug where a
 *      literal currency *code* ("TRY") got rendered as the amount's
 *      symbol instead of being mapped to "₺".
 */
const CURRENCY_BY_LANG: Record<BlokmateLanguage, { code: "TRY" | "EUR"; locale: string }> = {
  tr: { code: "TRY", locale: "tr-TR" },
  en: { code: "EUR", locale: "en-US" },
  bg: { code: "EUR", locale: "bg-BG" },
};

const SYMBOL_BY_CODE: Record<string, string> = {
  TRY: "₺",
  EUR: "€",
  BGN: "лв",
};

export function getBlokmateCurrency(lang: BlokmateLanguage, tenantCurrency?: string | null) {
  const locale = CURRENCY_BY_LANG[lang]?.locale ?? CURRENCY_BY_LANG.tr.locale;
  const code = tenantCurrency || CURRENCY_BY_LANG[lang]?.code || CURRENCY_BY_LANG.tr.code;
  const symbol = SYMBOL_BY_CODE[code] ?? code;
  return { code, symbol, locale };
}

export function formatBlokmateAmount(cents: number, lang: BlokmateLanguage, tenantCurrency?: string | null): string {
  const { symbol, locale } = getBlokmateCurrency(lang, tenantCurrency);
  const amount = (cents / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${symbol}`;
}

/**
 * Marketing-page currency formatter — for the logged-out /blokmate
 * landing page's mockup cards (Dashboard.tsx, MiniDemo.tsx), which have
 * no tenant/invoice to read a currency off of, only the visitor's
 * language. Locked to the same TR->TRY / EN,BG->EUR rule as
 * getBlokmateCurrency (no tenant override — there's no tenant here), via
 * Intl.NumberFormat rather than the manual toLocaleString + symbol
 * concatenation formatBlokmateAmount uses, since these callers pass
 * whole-currency-unit placeholder numbers (80, 8140), not integer cents.
 */
export function formatCurrency(value: number, lang: BlokmateLanguage): string {
  const { code, locale } = getBlokmateCurrency(lang);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
