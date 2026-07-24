"use client";

import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Enterprise hero — asymmetric editorial split: claim on the left, the
 * generated proof on the right. Brand-native (lavender / ink / Inter).
 */
export default function EnterpriseHero() {
  const { dict } = useLanguage();
  const h = dict.tryonPage.hero;
  const t = dict.tryon;

  return (
    <section
      id="tryon-hero"
      className="relative overflow-hidden border-b border-line pt-24 pb-20 md:pt-32 md:pb-28"
    >
      {/* Ambient field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-10rem] top-56 h-80 w-80 rounded-full bg-lavender-soft/35 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(var(--line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 30% 30%, #000 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 50% at 30% 30%, #000 30%, transparent 100%)",
          }}
        />
      </div>

      <div className="container-shell grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* Claim */}
        <div>
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {h.eyebrow}
          </span>
          <h1 className="mt-6 max-w-[15ch] text-4xl font-bold leading-[1.03] tracking-tightest text-ink sm:text-5xl lg:text-6xl">
            {h.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            {h.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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

          {/* Quiet proof strip */}
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
            {dict.tryonPage.caseStudy.metrics.slice(0, 3).map((m) => (
              <div key={m.label}>
                <dt className="text-xl font-semibold tracking-tight text-ink [font-variant-numeric:tabular-nums]">
                  {m.value}
                </dt>
                <dd className="mt-0.5 text-xs text-ink-faint">{m.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Proof */}
        <figure className="relative">
          <div className="card overflow-hidden shadow-lift">
            <div className="relative aspect-[4/5]">
              <Image
                src="/assets/tryon/result.jpg"
                alt={t.outputLabel}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover object-top"
              />
            </div>
          </div>
          <figcaption className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-ink shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {t.outputTag}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
