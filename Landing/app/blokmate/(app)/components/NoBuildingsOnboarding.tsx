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
  const building = buildingWord(lang).toLowerCase();

  const steps = [
    { title: `İlk ${building}nı ekle`, desc: "Adı ve adresi yeterli — daha fazlasını sonra düzenleyebilirsin." },
    { title: "Daireleri tanımla", desc: "Her daire için kısa bir etiket (örn. 3B) ve varsa malik adı." },
    { title: "Sakinleri davet et", desc: "Davet kodu ya da linkle sakinler kendi hesabını oluşturur, sen onaylarsın." },
  ];

  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-surface/60 p-10">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50">
          <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-blue-100/60 dark:bg-blue-950/30" />
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 5h16l-6 7.5V19l-4 2v-8.5z" />
          </svg>
        </span>

        <h2 className="mt-5 text-xl font-bold text-ink">Henüz bir {building} eklemediniz</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {buildingWordPlural(lang)}ınızı buradan ekleyin — 1 tane de olsa, 20 tane de. İstediğiniz kadar site/bina
          yönetebilirsiniz; her biri kendi daireleri, aidatları ve sakinleriyle ayrı ayrı çalışır.
        </p>

        <Link
          href="/blokmate/buildings"
          className="btn mt-6 min-h-[48px] bg-blue-600 px-7 text-sm font-semibold text-white shadow-soft hover:bg-blue-700"
        >
          Yeni Site Ekle
        </Link>
      </div>

      <ol className="mx-auto mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col items-center gap-2 rounded-xl bg-mist/50 p-4 text-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-bold text-blue-600 shadow-soft">
              {i + 1}
            </span>
            <p className="text-sm font-semibold text-ink">{step.title}</p>
            <p className="text-xs leading-relaxed text-ink-faint">{step.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
