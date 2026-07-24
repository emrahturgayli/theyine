"use client";

import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Pipeline diagram — Shopify → Fal.ai → Shopify.
 * Three nodes joined by connectors (horizontal on desktop, vertical on mobile).
 * Localized via dict.tryonPage.pipeline.
 */
export default function Pipeline() {
  const { dict } = useLanguage();
  const p = dict.tryonPage.pipeline;

  return (
    <section id="pipeline" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {p.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {p.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{p.subtitle}</p>
        </Reveal>

        <Reveal className="mt-14">
          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
            {p.steps.map((step, i) => (
              <div key={step.title} className="contents md:flex md:flex-1 md:items-center">
                <article
                  onClick={() => trackEvent("pipeline_interaction", step.title)}
                  className="card flex-1 cursor-pointer p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender-tint text-xs font-semibold text-lavender">
                      0{i + 1}
                    </span>
                    <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
                </article>
                {i < p.steps.length - 1 && (
                  <span
                    className="mx-auto my-1 flex shrink-0 rotate-90 items-center justify-center text-lavender md:mx-2 md:my-0 md:rotate-0"
                    aria-hidden
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {p.runtime}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
