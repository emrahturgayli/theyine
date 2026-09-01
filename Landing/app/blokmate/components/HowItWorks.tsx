"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";

export default function HowItWorks() {
  const { dict } = useBlokmateLanguage();
  const section = dict.howItWorks;

  return (
    <section id="how-it-works" className="border-b border-line py-20 md:py-28">
      <div className="container-shell">
        <div className="mx-auto max-w-xl text-center">
          <span className="eyebrow justify-center">{section.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{section.title}</h2>
          <p className="mt-4 text-lg text-ink-soft">{section.subtitle}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {section.steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
