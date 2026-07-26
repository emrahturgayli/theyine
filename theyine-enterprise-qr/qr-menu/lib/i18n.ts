// Hafif i18n katmanı: next.config.js'teki yerleşik locale routing ile çalışır.
// Kullanım: const t = useT();  t("nav.dashboard")
// Anahtar bulunamazsa anahtarın kendisi döner (eksik çeviri kolay fark edilir).

import { useRouter } from "next/router";
import bg from "../locales/bg.json";
import en from "../locales/en.json";

type Dict = { [key: string]: string | Dict };

const dicts: Record<string, Dict> = { bg, en };

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(locale: string | undefined, key: string): string {
  const dict = dicts[locale || "bg"] || dicts.bg;
  return lookup(dict, key) ?? lookup(dicts.bg, key) ?? key;
}

export function useT() {
  const { locale } = useRouter();
  return (key: string) => translate(locale, key);
}
