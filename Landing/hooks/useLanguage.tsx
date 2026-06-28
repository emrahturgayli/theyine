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

import en from "@/locales/en.json";
import bg from "@/locales/bg.json";
import tr from "@/locales/tr.json";

export type Language = "en" | "bg" | "tr";

/** Shape of a locale dictionary — derived from the English source of truth. */
export type Dictionary = typeof en;

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "bg", label: "BG" },
  { code: "tr", label: "TR" },
];

// JSON imports infer per-file literal string types; widen to the English shape
// so every locale shares one structural contract.
const DICTIONARIES = { en, bg, tr } as unknown as Record<Language, Dictionary>;
const STORAGE_KEY = "theyine-lang";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Full dictionary for the active language (use for arrays/objects). */
  dict: Dictionary;
  /** Dot-path string lookup, e.g. t("nav.studio"). */
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolve(obj: unknown, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  return typeof value === "string" ? value : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  // Hydrate from storage / browser preference after mount.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && stored in DICTIONARIES) {
      setLangState(stored);
      return;
    }
    const browser = navigator.language.slice(0, 2).toLowerCase();
    if (browser in DICTIONARIES) setLangState(browser as Language);
  }, []);

  // Keep <html lang> in sync for accessibility / SEO.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const dict = DICTIONARIES[lang];
  const t = useCallback((path: string) => resolve(dict, path), [dict]);

  const value = useMemo(
    () => ({ lang, setLang, dict, t }),
    [lang, setLang, dict, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
