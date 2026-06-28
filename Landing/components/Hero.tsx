"use client";

import { TheyineMark } from "./Logo";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Hero — bright, breathing, premium.
 * Visual is an original abstract orbital field (soft lavender gradients + the
 * network mark) — no robotic imagery. Copy is driven by the active locale.
 */
export default function Hero() {
  const { dict } = useLanguage();
  const hero = dict.hero;

  return (
    <section
      id="studio"
      className="relative overflow-hidden border-b border-line pt-20 pb-24 md:pt-28 md:pb-36"
    >
      {/* Ambient background ------------------------------------------------ */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-8rem] top-40 h-72 w-72 rounded-full bg-lavender-soft/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(var(--line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 35%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 55% at 50% 35%, #000 40%, transparent 100%)",
          }}
        />
      </div>

      <div className="container-shell flex flex-col items-center text-center">
        {/* Brand mark */}
        <div className="animate-fade-in mb-8 flex flex-col items-center gap-5">
          <span className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-lavender-soft/70" />
            <TheyineMark size={56} className="animate-float text-ink" />
          </span>
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {hero.badge}
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up mx-auto max-w-4xl text-4xl font-bold leading-[1.05] tracking-tightest text-ink sm:text-5xl md:text-6xl lg:text-7xl">
          {hero.titleA}
          <span className="text-gradient">{hero.titleB}</span>
        </h1>

        <p
          className="animate-fade-up mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft"
          style={{ animationDelay: "120ms" }}
        >
          {hero.subtitle}
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-up mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          style={{ animationDelay: "220ms" }}
        >
          <a href="#contact" className="btn-primary w-full sm:w-auto">
            {hero.ctaPrimary}
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
          <a href="#services" className="btn-secondary w-full sm:w-auto">
            {hero.ctaSecondary}
          </a>
        </div>

        {/* Trust strip */}
        <div
          className="animate-fade-in mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-ink-faint"
          style={{ animationDelay: "320ms" }}
        >
          {hero.audience.map((item) => (
            <span key={item} className="font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
