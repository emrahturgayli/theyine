"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { trackEvent } from "@/lib/analytics";

export default function BlokMateHero() {
  const { dict } = useBlokmateLanguage();
  const hero = dict.hero;

  return (
    <section className="relative overflow-hidden border-b border-line pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/40" />
      </div>

      <div className="container-shell flex flex-col items-center text-center">
        <span className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          {hero.badge}
        </span>

        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tightest text-ink sm:text-5xl md:text-6xl">
          {hero.titleA}
          <span className="text-blue-600">{hero.titleB}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{hero.subtitle}</p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href="#demo"
            onClick={() => trackEvent("cta_click", "blokmate_hero_demo")}
            className="btn w-full bg-blue-600 text-white shadow-soft hover:bg-blue-700 sm:w-auto"
          >
            {hero.ctaDemo}
          </a>
          <a
            href="#pricing"
            onClick={() => trackEvent("cta_click", "blokmate_hero_start")}
            className="btn w-full border border-line bg-transparent text-ink hover:border-blue-600 hover:text-blue-600 sm:w-auto"
          >
            {hero.ctaStart}
          </a>
        </div>

        <div className="mt-16 grid w-full max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
          {hero.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="text-2xl font-bold text-ink sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-ink-faint">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
