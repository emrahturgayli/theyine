"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { trackEvent } from "@/lib/analytics";

export default function PricingSummary() {
  const { dict } = useBlokmateLanguage();
  const section = dict.pricing;

  return (
    <section id="pricing" className="border-b border-line py-20 md:py-28">
      <div className="container-shell">
        <div className="mx-auto max-w-xl text-center">
          <span className="eyebrow justify-center">{section.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{section.title}</h2>
          <p className="mt-4 text-lg text-ink-soft">{section.subtitle}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {section.plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`card flex flex-col p-7 ${i === 1 ? "border-blue-600 shadow-lift" : ""}`}
            >
              <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              <div className="mt-3 text-3xl font-bold text-ink">{plan.price}</div>
              <div className="mt-1 text-sm text-ink-faint">{plan.unit}</div>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-blue-600" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                onClick={() => trackEvent("cta_click", `blokmate_pricing_${plan.name}`)}
                className={`btn mt-7 w-full ${
                  i === 1
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-line bg-transparent text-ink hover:border-blue-600 hover:text-blue-600"
                }`}
              >
                {section.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
