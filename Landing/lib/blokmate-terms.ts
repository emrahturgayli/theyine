import type { BlokmateLanguage } from "@/hooks/useBlokmateLanguage";

/**
 * The "buildings" table is called "Bina" in Turkish copy (matches
 * SPEC.md's data-model naming, "Buildings (Binalar/Siteler)") but "Block"
 * in English/Bulgarian — a deliberate market-driven word choice, not a
 * literal translation of the other. Centralized here so the app dashboard
 * (which has no per-string i18n dictionary, unlike the marketing site's
 * locales/*.json) doesn't end up with the two terms drifting apart.
 */
export function buildingWord(lang: BlokmateLanguage): string {
  return lang === "tr" ? "Bina" : "Block";
}

export function buildingWordPlural(lang: BlokmateLanguage): string {
  return lang === "tr" ? "Binalar" : "Blocks";
}
