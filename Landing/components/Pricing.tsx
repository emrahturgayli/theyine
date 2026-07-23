"use client";

import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Pricing — symbolic first-stage tiers for the try-on automation.
 * Brand-native (light, lavender, Inter), localized via dict.pricing.
 * The middle plan is featured. All CTAs point to the contact section.
 */
export default function Pricing() {
  const { dict } = useLanguage();
  const t = dict.pricing;

  return (
    <section id="pricing" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {t.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{t.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {t.plans.map((plan, i) => {
            const featured = i === 1;
            return (
              <Reveal key={plan.name} delay={i * 90}>
                <article
                  className={`card flex h-full flex-col p-7 ${
                    featured ? "border-lavender shadow-lift" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                    {featured && (
                      <span className="rounded-full bg-lavender px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
                        {t.popular}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-ink">
                      {plan.price}
                    </span>
                    {plan.unit && (
                      <span className="text-sm text-ink-faint">{plan.unit}</span>
                    )}
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-ink-soft"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-lavender"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#contact"
                    className={`mt-8 w-full ${featured ? "btn-primary" : "btn-secondary"}`}
                  >
                    {t.cta}
                  </a>
                </article>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-ink-faint">{t.note}</p>
      </div>
    </section>
  );
}
