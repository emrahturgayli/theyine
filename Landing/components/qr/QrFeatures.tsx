"use client";

import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Feature grid for the enterprise QR page — six numbered cards in the same
 * visual language as the try-on sections (numbered chips, card surfaces,
 * eyebrow + oversized heading intro).
 */
export default function QrFeatures() {
  const { dict } = useLanguage();
  const f = dict.qrPage.features;

  return (
    <section id="qr-features" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {f.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {f.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{f.subtitle}</p>
        </Reveal>

        <Reveal className="mt-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {f.items.map((item, idx) => (
              <article key={item.title} className="card flex flex-col gap-4 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender text-xs font-semibold text-white shadow-soft">
                  0{idx + 1}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">{item.desc}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
