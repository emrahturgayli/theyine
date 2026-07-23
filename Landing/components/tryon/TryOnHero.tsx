"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Enterprise hero for the /shopify-virtual-try-on page.
 * Brand-native, localized via dict.tryonPage.hero. CTAs fire analytics events.
 */
export default function TryOnHero() {
  const { dict } = useLanguage();
  const h = dict.tryonPage.hero;

  return (
    <section
      id="tryon-hero"
      className="relative overflow-hidden border-b border-line pt-24 pb-20 md:pt-32 md:pb-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-64 w-64 rounded-full bg-lavender-soft/40 blur-3xl" />
      </div>

      <div className="container-shell max-w-4xl text-center">
        <span className="eyebrow justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
          {h.eyebrow}
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tightest text-ink sm:text-5xl md:text-6xl">
          {h.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {h.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#contact"
            onClick={() => trackEvent("cta_click", "start_project")}
            className="btn-primary w-full sm:w-auto"
          >
            {h.ctaPrimary}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <a
            href="#tryon"
            onClick={() => trackEvent("cta_click", "automate_store")}
            className="btn-secondary w-full sm:w-auto"
          >
            {h.ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
