"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Gallery of Intelligence — THEYINE's signature "AI Capability Map".
 * The flat reference list is reimagined as interactive pill-style tabs with an
 * active-state glow. Selecting a capability swaps an original abstract visual
 * (SVG/CSS — no robots, no stock imagery) plus its narrative and tags.
 * Copy is localized; the abstract visual variant is index-aligned.
 */

const VARIANTS: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

function AbstractField({ variant }: { variant: 1 | 2 | 3 | 4 }) {
  const gradients: Record<number, string> = {
    1: "radial-gradient(120% 120% at 20% 10%, #F1EEFE 0%, #FFFFFF 45%), radial-gradient(80% 80% at 90% 90%, #C9C7F5 0%, transparent 55%)",
    2: "linear-gradient(135deg, #F9F9FB 0%, #F1EEFE 100%)",
    3: "radial-gradient(100% 100% at 80% 20%, #EDEDF2 0%, #FFFFFF 60%)",
    4: "radial-gradient(110% 110% at 30% 90%, #F1EEFE 0%, #FFFFFF 55%)",
  };

  return (
    <div
      className="absolute inset-0"
      style={{ background: gradients[variant] }}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 300"
        className="h-full w-full text-lavender"
        preserveAspectRatio="xMidYMid slice"
      >
        {variant === 1 && (
          <g fill="none" stroke="currentColor" strokeWidth="1">
            {Array.from({ length: 7 }).map((_, i) => (
              <circle key={i} cx="200" cy="150" r={20 + i * 22} opacity={0.5 - i * 0.05} />
            ))}
            <circle cx="200" cy="150" r="6" fill="currentColor" stroke="none" />
            <circle cx="288" cy="150" r="4" fill="currentColor" stroke="none" />
            <circle cx="200" cy="62" r="4" fill="currentColor" stroke="none" />
          </g>
        )}
        {variant === 2 && (
          <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6">
            {Array.from({ length: 9 }).map((_, i) => (
              <path
                key={i}
                d={`M0 ${40 + i * 28} C 120 ${10 + i * 28}, 280 ${70 + i * 28}, 400 ${30 + i * 28}`}
              />
            ))}
          </g>
        )}
        {variant === 3 && (
          <g stroke="currentColor" strokeWidth="1" opacity="0.7">
            {Array.from({ length: 6 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => (
                <circle
                  key={`${r}-${c}`}
                  cx={30 + c * 48}
                  cy={30 + r * 48}
                  r={2 + ((r + c) % 3)}
                  fill="currentColor"
                  stroke="none"
                  opacity={0.25 + ((r * c) % 5) * 0.12}
                />
              ))
            )}
          </g>
        )}
        {variant === 4 && (
          <g fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.65">
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={200}
                  y1={150}
                  x2={200 + Math.cos(a) * 150}
                  y2={150 + Math.sin(a) * 110}
                />
              );
            })}
            {Array.from({ length: 4 }).map((_, i) => (
              <circle key={`r${i}`} cx="200" cy="150" r={30 + i * 34} />
            ))}
            <circle cx="200" cy="150" r="6" fill="currentColor" stroke="none" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function Gallery() {
  const { dict } = useLanguage();
  const gallery = dict.gallery;
  const method = dict.method;
  const capabilities = gallery.capabilities;

  const [active, setActive] = useState(0);
  const current = capabilities[active];
  const currentVariant = VARIANTS[active] ?? 1;

  return (
    <>
      {/* AI Capability Map -------------------------------------------- */}
      <section id="work" className="border-b border-line py-24 md:py-section">
        <div className="container-shell">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{gallery.eyebrow}</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {gallery.title}
            </h2>
            <p className="mt-4 text-lg text-ink-soft">{gallery.subtitle}</p>
          </Reveal>

          {/* Pill tabs */}
          <Reveal className="mt-10">
            <div
              role="tablist"
              aria-label={gallery.eyebrow}
              className="flex flex-wrap gap-2.5"
            >
              {capabilities.map((cap, i) => {
                const selected = i === active;
                return (
                  <button
                    key={i}
                    role="tab"
                    id={`tab-${i}`}
                    aria-selected={selected}
                    aria-controls={`panel-${i}`}
                    onClick={() => setActive(i)}
                    className={`min-h-[44px] rounded-full border px-5 text-sm font-medium transition-all duration-300 ${
                      selected
                        ? "border-lavender bg-lavender text-white shadow-lift"
                        : "border-line bg-surface text-ink-soft hover:border-lavender-soft hover:text-ink"
                    }`}
                  >
                    {cap.label}
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Active panel */}
          <Reveal className="mt-8">
            <div
              role="tabpanel"
              id={`panel-${active}`}
              aria-labelledby={`tab-${active}`}
              className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center"
            >
              <div className="card relative aspect-[16/10] overflow-hidden lg:col-span-7">
                {/* key forces a soft fade between capabilities */}
                <div key={active} className="animate-fade-in absolute inset-0">
                  <AbstractField variant={currentVariant} />
                </div>
              </div>

              <div className="lg:col-span-5">
                <div key={active} className="animate-fade-up">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-lavender">
                    {current.meta}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-ink md:text-3xl">
                    {current.title}
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                    {current.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {current.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-lavender-soft bg-lavender-tint px-3 py-1 text-xs font-medium text-lavender"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Methodology --------------------------------------------------- */}
      <section id="method" className="border-b border-line bg-mist/50 py-24 md:py-section">
        <div className="container-shell">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{method.eyebrow}</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {method.title}
            </h2>
            <p className="mt-4 text-lg text-ink-soft">{method.subtitle}</p>
          </Reveal>

          <div className="mt-12 overflow-hidden rounded-xl2 border border-line bg-surface">
            {method.steps.map((step, i) => (
              <Reveal key={i} delay={i * 70}>
                <div
                  className={`group flex flex-col gap-3 px-6 py-8 transition-colors hover:bg-lavender-tint md:flex-row md:items-center md:gap-8 md:px-10 ${
                    i !== method.steps.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <span className="text-sm font-semibold tracking-[0.3em] text-lavender">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold text-ink md:w-72 md:shrink-0">
                    {step.title}
                  </h3>
                  <p className="text-ink-soft">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
