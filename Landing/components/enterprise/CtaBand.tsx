"use client";

import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Mid-page CTA band on the always-dark panel — the commitment moment
 * between proof and pricing.
 */
export default function CtaBand() {
  const { dict } = useLanguage();
  const b = dict.tryonPage.ctaBand;

  return (
    <section className="border-b border-line py-20 md:py-24">
      <div className="container-shell">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl2 bg-panel px-6 py-14 text-center sm:px-10 md:px-16 md:py-20">
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-lavender/40 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-lavender-soft/30 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                {b.title}
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/70">
                {b.subtitle}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#contact"
                  onClick={() => trackEvent("cta_click", "band_start_project")}
                  className="btn-on-dark w-full sm:w-auto"
                >
                  {b.primary}
                </a>
                <a
                  href="#pricing"
                  onClick={() => trackEvent("cta_click", "band_see_pricing")}
                  className="btn w-full border border-white/20 text-white hover:bg-white/10 sm:w-auto"
                >
                  {b.secondary}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
