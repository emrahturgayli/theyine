"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import tr from "@/app/blokmate/locales/tr.json";
import en from "@/app/blokmate/locales/en.json";
import bg from "@/app/blokmate/locales/bg.json";

/**
 * BlokMate's own language context — deliberately separate from
 * hooks/useLanguage.tsx (the main THEYINE site's). BlokMate is a distinct
 * sub-product with its own content lifecycle; folding its copy into the
 * shared site-wide Dictionary type would bloat every page's type checking
 * with content only /blokmate ever reads. Same pattern otherwise (storage
 * key, browser-language detection, dot-path `t()`).
 */

export type BlokmateLanguage = "tr" | "en" | "bg";
export type BlokmateDictionary = typeof tr;

export const BLOKMATE_LANGUAGES: { code: BlokmateLanguage; label: string }[] = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
  { code: "bg", label: "BG" },
];

const DICTIONARIES = { tr, en, bg } as unknown as Record<BlokmateLanguage, BlokmateDictionary>;
const STORAGE_KEY = "blokmate-lang";

type ContextValue = {
  lang: BlokmateLanguage;
  setLang: (lang: BlokmateLanguage) => void;
  dict: BlokmateDictionary;
  t: (path: string) => string;
};

const BlokmateLanguageContext = createContext<ContextValue | null>(null);

function resolve(obj: unknown, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  return typeof value === "string" ? value : path;
}

export function BlokmateLanguageProvider({ children }: { children: ReactNode }) {
  // BlokMate's primary market is Turkish/Bulgarian-speaking property
  // managers — default to Turkish rather than English while the browser
  // language check below runs.
  const [lang, setLangState] = useState<BlokmateLanguage>("tr");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as BlokmateLanguage | null;
    if (stored && stored in DICTIONARIES) {
      setLangState(stored);
      return;
    }
    const browser = navigator.language.slice(0, 2).toLowerCase();
    if (browser in DICTIONARIES) setLangState(browser as BlokmateLanguage);
  }, []);

  const setLang = useCallback((next: BlokmateLanguage) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const dict = DICTIONARIES[lang];
  const t = useCallback((path: string) => resolve(dict, path), [dict]);

  const value = useMemo(() => ({ lang, setLang, dict, t }), [lang, setLang, dict, t]);

  return (
    <BlokmateLanguageContext.Provider value={value}>
      {children}
    </BlokmateLanguageContext.Provider>
  );
}

export function useBlokmateLanguage() {
  const ctx = useContext(BlokmateLanguageContext);
  if (!ctx) {
    throw new Error("useBlokmateLanguage must be used within a BlokmateLanguageProvider");
  }
  return ctx;
}
