"use client";

import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Case study — pilot metrics + a short quote.
 * Localized via dict.tryonPage.caseStudy.
 */
export default function CaseStudy() {
  const { dict } = useLanguage();
  const c = dict.tryonPage.caseStudy;

  return (
    <section id="case-study" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {c.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{c.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {c.metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 80}>
              <article className="card h-full p-6 text-center">
                <div className="text-3xl font-bold tracking-tight text-lavender [font-variant-numeric:tabular-nums]">
                  {m.value}
                </div>
                <div className="mt-2 text-sm text-ink-soft">{m.label}</div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
          <figure className="card bg-mist p-8 md:p-10">
            <blockquote className="text-xl font-medium leading-relaxed tracking-tight text-ink md:text-2xl">
              “{c.quote}”
            </blockquote>
            <figcaption className="mt-4 text-sm font-medium text-ink-faint">
              {c.quoteBy}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
