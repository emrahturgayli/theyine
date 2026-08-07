"use client";

import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Trust section — the three engineering claims VCs and enterprise buyers
 * probe first (integration cost, measurability, scale), each scoped to
 * what the running system actually does. Localized via dict.tryonPage.trust.
 */
export default function TrustSection() {
  const { dict } = useLanguage();
  const t = dict.tryonPage.trust;

  return (
    <section id="trust" className="border-b border-line py-24 md:py-section">
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

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {t.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <article className="card h-full p-7">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-lavender-soft bg-surface text-xs font-semibold text-lavender">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
