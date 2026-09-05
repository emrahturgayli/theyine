"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord } from "@/lib/blokmate-terms";

const STORAGE_KEY = "blokmate-onboarding-dismissed";

/**
 * First-run tip strip for a new manager — three one-line pointers to
 * where the core actions live, dismissed permanently once closed
 * (localStorage, per-browser — not synced anywhere, so it's fine to
 * reappear on a different device; nothing here is load-bearing state).
 */
export default function OnboardingTips() {
  const { lang } = useBlokmateLanguage();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage unavailable — dismissal just won't persist across reloads.
    }
  }

  if (dismissed) return null;

  const tips = [
    { href: "/blokmate/buildings", text: `Buradan ${buildingWord(lang).toLowerCase()} ekleyebilirsin` },
    { href: "/blokmate/invoices", text: "Buradan aidat oluşturabilirsin" },
    { href: "/blokmate/tickets", text: "Buradan sakinlerin taleplerini görebilirsin" },
    { href: "/blokmate/settings", text: "Ayarlar'dan örnek demo verisi yükleyebilirsin" },
  ];

  return (
    <div className="card flex flex-wrap items-center gap-3 border-blue-200 bg-blue-50/60 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/30">
      <span className="font-semibold text-ink">Hızlı başlangıç:</span>
      {tips.map((tip) => (
        <Link key={tip.href} href={tip.href} className="text-blue-600 hover:underline">
          {tip.text}
        </Link>
      ))}
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto text-xs font-semibold text-ink-faint hover:text-ink"
      >
        Kapat
      </button>
    </div>
  );
}
