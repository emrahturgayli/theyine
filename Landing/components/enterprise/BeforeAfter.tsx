"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * Before/after comparison — the slider frame runs wide, with a narrow
 * editorial sidebar carrying the claim and proof line instead of a
 * centered header. Pure CSS/JS: a clipped overlay driven by a full-cover
 * range input (draggable, keyboard-accessible). Fires slider_interaction once.
 */
export default function BeforeAfter() {
  const { dict } = useLanguage();
  const c = dict.tryonPage.compare;
  const t = dict.tryon;

  const [pos, setPos] = useState(52);
  const fired = useRef(false);

  function onSlide(value: number) {
    setPos(value);
    if (!fired.current) {
      fired.current = true;
      trackEvent("slider_interaction", "before_after");
    }
  }

  return (
    <section id="compare" className="border-b border-line py-24 md:py-section">
      <div className="container-shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4 lg:pt-2">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {c.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight text-ink md:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 max-w-sm text-lg text-ink-soft">{c.subtitle}</p>

          <p className="mt-10 hidden items-start gap-2.5 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft lg:flex">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender" />
            {t.proof.replace("{product}", t.productName)}
          </p>
        </Reveal>

        <Reveal className="lg:col-span-8" delay={80}>
          <div className="card overflow-hidden shadow-lift">
            <div className="relative aspect-[4/5] select-none bg-mist sm:aspect-[4/3]">
              {/* Before — plain model */}
              <Image
                src="/assets/tryon/model.jpg"
                alt={t.beforeLabel}
                fill
                sizes="(max-width: 1280px) 100vw, 1000px"
                className="object-cover object-top"
              />
              {/* After — dressed result, revealed from the right */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
                <Image
                  src="/assets/tryon/result.jpg"
                  alt={t.afterLabel}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1000px"
                  className="object-cover object-top"
                />
              </div>

              <span className="pointer-events-none absolute left-5 top-5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                {t.beforeLabel}
              </span>
              <span className="pointer-events-none absolute right-5 top-5 rounded-full bg-lavender px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white">
                {t.afterLabel}
              </span>

              {/* Divider + handle */}
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                style={{ left: `${pos}%` }}
              >
                <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-lavender shadow-lift">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 6l-4 6 4 6M15 6l4 6-4 6" />
                  </svg>
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={pos}
                onChange={(e) => onSlide(Number(e.target.value))}
                aria-label={t.sliderHint}
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
              />
            </div>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft lg:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {t.proof.replace("{product}", t.productName)}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
