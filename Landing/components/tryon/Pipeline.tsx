"use client";

import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Pipeline diagram — Shopify → Fal.ai → Shopify.
 * A single connecting line runs behind the three steps (vertical on mobile,
 * horizontal on desktop); each step is a numbered card staggered along it,
 * read top-to-bottom / left-to-right as one continuous flow.
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

        <Reveal className="mt-16">
          <div className="relative">
            {/* Connecting line — behind the cards */}
            <div
              aria-hidden
              className="absolute left-5 top-0 bottom-0 w-px bg-line md:left-0 md:right-0 md:top-9 md:bottom-auto md:h-px md:w-auto"
            />

            <div className="relative flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-6">
              {p.steps.map((step, i) => (
                <article
                  key={step.title}
                  onClick={() => trackEvent("pipeline_interaction", step.title)}
                  className={`card relative flex cursor-pointer gap-4 p-6 pl-4 md:block md:w-[31%] md:pl-6 ${
                    i === 1 ? "md:mt-10" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-xs font-semibold text-lavender md:absolute md:-top-[3.25rem] md:left-6 md:border-lavender-soft md:bg-surface">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <p className="mt-10 flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {p.runtime}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
