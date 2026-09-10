"use client";

import Link from "next/link";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWord, buildingWordPlural } from "@/lib/blokmate-terms";

/**
 * Shown on the dashboard instead of the (meaningless-at-zero) metric
 * cards when a manager has no buildings yet. Registration no longer
 * creates one automatically (see app/api/blokmate/register/route.ts) —
 * a manager who runs many sites adds them here, one at a time, as many
 * as they need, rather than being forced to name a single one at signup.
 */
export default function NoBuildingsOnboarding() {
  const { lang } = useBlokmateLanguage();

  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 5h16l-6 7.5V19l-4 2v-8.5z" />
        </svg>
      </span>
      <h2 className="text-lg font-bold text-ink">Henüz bir {buildingWord(lang).toLowerCase()} eklemediniz.</h2>
      <p className="max-w-sm text-sm text-ink-soft">
        {buildingWordPlural(lang)}ınızı buradan ekleyin — 1 tane de olsa, 20 tane de. İstediğiniz kadar site/bina
        yönetebilirsiniz.
      </p>
      <Link href="/blokmate/buildings" className="btn mt-2 bg-blue-600 text-white hover:bg-blue-700">
        Yeni Site Ekle
      </Link>
    </div>
  );
}
