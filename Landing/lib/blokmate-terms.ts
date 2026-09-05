import type { BlokmateLanguage } from "@/hooks/useBlokmateLanguage";

/**
 * The "buildings" table is called "Apartman" in Turkish copy but "Block"
 * in English/Bulgarian — a deliberate market-driven word choice, not a
 * literal translation of the other. Centralized here so the app dashboard
 * (which has no per-string i18n dictionary, unlike the marketing site's
 * locales/*.json) doesn't end up with the two terms drifting apart.
 */
export function buildingWord(lang: BlokmateLanguage): string {
  return lang === "tr" ? "Apartman" : "Block";
}

export function buildingWordPlural(lang: BlokmateLanguage): string {
  return lang === "tr" ? "Apartmanlar" : "Blocks";
}
