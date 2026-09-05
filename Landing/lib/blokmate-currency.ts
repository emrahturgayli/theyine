import type { BlokmateLanguage } from "@/hooks/useBlokmateLanguage";

/**
 * Bulgaria is transitioning to the euro, so the invoices.currency column
 * (default 'BGN', supabase/migrations/001_init_blokmate.sql) is no longer
 * a safe display value on its own — there's no tenants.currency column to
 * read a per-tenant override from yet, so display falls back to the
 * active UI locale: Turkish managers see TRY, English/Bulgarian see EUR.
 */
const CURRENCY_BY_LANG: Record<BlokmateLanguage, { code: string; symbol: string; locale: string }> = {
  tr: { code: "TRY", symbol: "₺", locale: "tr-TR" },
  en: { code: "EUR", symbol: "€", locale: "en-US" },
  bg: { code: "EUR", symbol: "€", locale: "bg-BG" },
};

export function getBlokmateCurrency(lang: BlokmateLanguage, tenantCurrency?: string | null) {
  if (tenantCurrency) return { code: tenantCurrency, symbol: tenantCurrency, locale: CURRENCY_BY_LANG[lang].locale };
  return CURRENCY_BY_LANG[lang] ?? CURRENCY_BY_LANG.tr;
}

export function formatBlokmateAmount(cents: number, lang: BlokmateLanguage, tenantCurrency?: string | null): string {
  const { symbol, locale } = getBlokmateCurrency(lang, tenantCurrency);
  const amount = (cents / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${symbol}`;
}
