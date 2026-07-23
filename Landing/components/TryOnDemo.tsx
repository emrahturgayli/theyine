"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { track } from "@/lib/analytics";

/**
 * TryOnDemo — live proof section for the Shopify × AI virtual try-on automation.
 * Left: the plain model (input). Center: engine + product. Right: an interactive
 * before/after slider between the plain model and the dressed result.
 * Brand-native (light, lavender, Inter), localized via dict.tryon.
 */
export default function TryOnDemo() {
  const { dict } = useLanguage();
  const t = dict.tryon;
  const [pos, setPos] = useState(50); // slider konumu (%) — before/after geçişi

  return (
    <section id="tryon" className="border-b border-line py-24 md:py-section">
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

        {/* Input → engine → before/after output */}
        <Reveal className="mt-14">
          <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
            {/* Input: plain model */}
            <figure className="card overflow-hidden">
              <figcaption className="flex items-center justify-between border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
                <span>{t.inputLabel}</span>
                <span className="rounded-full bg-mist px-2.5 py-1 text-[0.6rem] text-ink-soft">
                  {t.inputTag}
                </span>
              </figcaption>
              <div className="relative aspect-[3/4] bg-mist">
                <Image
                  src="/assets/tryon/model.jpg"
                  alt={t.inputLabel}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top"
                />
              </div>
            </figure>

            {/* Engine node + product */}
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-lavender bg-lavender-tint text-xs font-semibold tracking-wide text-lavender">
                AI
              </span>
              <span className="max-w-[9rem] text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
                {t.engine}
              </span>
              <span className="flex items-center gap-2">
                <span className="relative h-7 w-7 overflow-hidden rounded-full border border-line">
                  <Image
                    src="/assets/tryon/garment.jpg"
                    alt={t.productName}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </span>
                <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-ink-soft">
                  {t.productTag}
                </span>
              </span>
            </div>

            {/* Output: interactive before/after slider */}
            <figure className="card overflow-hidden border-lavender-soft shadow-lift">
              <figcaption className="flex items-center justify-between border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-lavender">
                <span>{t.outputLabel}</span>
                <span className="rounded-full bg-lavender-tint px-2.5 py-1 text-[0.6rem] text-lavender">
                  {t.outputTag}
                </span>
              </figcaption>

              <div className="relative aspect-[3/4] select-none bg-mist">
                {/* Before = plain model (full) */}
                <Image
                  src="/assets/tryon/model.jpg"
                  alt={t.beforeLabel}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top"
                />
                {/* After = dressed result, clipped by slider position */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
                >
                  <Image
                    src="/assets/tryon/result.jpg"
                    alt={t.afterLabel}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top"
                  />
                </div>

                {/* Corner labels */}
                <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-white">
                  {t.beforeLabel}
                </span>
                <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-lavender px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-white">
                  {t.afterLabel}
                </span>

                {/* Divider + handle */}
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                  style={{ left: `${pos}%` }}
                >
                  <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-lavender shadow-soft">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 6l-4 6 4 6M15 6l4 6-4 6" />
                    </svg>
                  </span>
                </div>

                {/* Full-cover range input drives the slider (accessible + draggable) */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pos}
                  onChange={(e) => setPos(Number(e.target.value))}
                  aria-label={t.sliderHint}
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>
            </figure>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {t.proof.replace("{product}", t.productName)}
          </p>
        </Reveal>

        {/* Three-step flow (a real sequence → numbered) */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {t.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <article className="card card-hover h-full p-6">
                <span className="text-xs font-semibold tracking-[0.1em] text-lavender">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <a
            href="#contact"
            onClick={() => track("cta_click", { cta: "automate_store", section: "tryon_demo" })}
            className="btn-primary"
          >
            {t.cta}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
