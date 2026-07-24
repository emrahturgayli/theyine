"use client";

import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Enterprise hero — editorial masthead. The claim runs the full top band,
 * oversized and confident; the proof image breaks the grid beneath it,
 * overlapping the text column like a pasted print spread. Brand-native
 * (lavender / ink / Inter) only.
 */
export default function EnterpriseHero() {
  const { dict } = useLanguage();
  const h = dict.tryonPage.hero;
  const t = dict.tryon;

  return (
    <section
      id="tryon-hero"
      className="relative overflow-hidden border-b border-line pt-24 pb-0 md:pt-32"
    >
      {/* Ambient field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-80 w-80 rounded-full bg-lavender-soft/35 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(var(--line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 60% 45% at 20% 20%, #000 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 45% at 20% 20%, #000 30%, transparent 100%)",
          }}
        />
      </div>

      <div className="container-shell">
        {/* Masthead — full-width claim, oversized */}
        <div className="grid gap-10 border-b border-line pb-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
              {h.eyebrow}
            </span>
            <h1 className="mt-6 max-w-[17ch] text-5xl font-bold leading-[0.98] tracking-tightest text-ink sm:text-6xl lg:text-7xl">
              {h.title}
            </h1>
          </div>

          <div className="flex flex-col justify-end gap-8 lg:col-span-4">
            <p className="max-w-md text-lg leading-relaxed text-ink-soft">
              {h.subtitle}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href="#contact"
                onClick={() => trackEvent("cta_click", "hero_start_project")}
                className="btn-primary w-full sm:w-auto"
              >
                {h.ctaPrimary}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="#compare"
                onClick={() => trackEvent("cta_click", "hero_automate_store")}
                className="btn-secondary w-full sm:w-auto"
              >
                {h.ctaSecondary}
              </a>
            </div>
          </div>
        </div>

        {/* Proof spread — image overlaps the masthead edge, metrics sit beside it */}
        <div className="relative grid gap-10 py-16 lg:grid-cols-12 lg:items-end lg:gap-6">
          <figure className="relative -mt-24 lg:col-span-7 lg:-mt-32">
            <div className="card overflow-hidden shadow-lift">
              <div className="relative aspect-[16/10] sm:aspect-[16/9]">
                <Image
                  src="/assets/tryon/result.jpg"
                  alt={t.outputLabel}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-top"
                />
              </div>
            </div>
            <figcaption className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-ink shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
              {t.outputTag}
            </figcaption>
          </figure>

          <dl className="grid grid-cols-3 gap-x-6 gap-y-8 lg:col-span-5 lg:pl-6">
            {dict.tryonPage.caseStudy.metrics.slice(0, 3).map((m, i) => (
              <div key={m.label} className="border-l border-line pl-4">
                <dt className="text-2xl font-semibold tracking-tight text-ink [font-variant-numeric:tabular-nums] lg:text-3xl">
                  {m.value}
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-faint">{m.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
