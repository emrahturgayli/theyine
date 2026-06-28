"use client";

import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Services — sourced from brand.md §9.
 * Two-column grid of horizontal cards: icon rail on the left, copy on the
 * right. The layout breaks vertical monotony and improves scannability while
 * keeping the minimal, premium feel. Each service has a distinct, functional
 * line-glyph icon (geometric, non-robotic). Icons are index-aligned with the
 * localized `services.items` array.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: JSX.Element[] = [
  // AI Automation Systems
  <svg key="i0" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="5" cy="5" r="2" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M6.5 6.5 9.7 9.7M17.5 6.5 14.3 9.7M6.5 17.5 9.7 14.3M17.5 17.5 14.3 14.3" />
  </svg>,
  // Workflow Optimization
  <svg key="i1" viewBox="0 0 24 24" {...stroke}>
    <path d="M4 7h9M4 12h13M4 17h7" />
    <path d="M17 5l3 2-3 2M14 15l3 2-3 2" />
  </svg>,
  // Creative AI Tools
  <svg key="i2" viewBox="0 0 24 24" {...stroke}>
    <path d="M12 3l1.8 4.7L18.5 9l-3.5 3 1 5-4-2.6L8 17l1-5L5.5 9l4.7-1.3z" />
  </svg>,
  // Digital Design Systems
  <svg key="i3" viewBox="0 0 24 24" {...stroke}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <circle cx="17.5" cy="17.5" r="3.5" />
  </svg>,
  // Landing & Web Production
  <svg key="i4" viewBox="0 0 24 24" {...stroke}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M3 8h18M7 12h6" />
  </svg>,
  // Content & UGC Systems
  <svg key="i5" viewBox="0 0 24 24" {...stroke}>
    <path d="M4 5h16v11H7l-3 3z" />
    <path d="M8 9h8M8 12h5" />
  </svg>,
  // QR Menu & Restaurant
  <svg key="i6" viewBox="0 0 24 24" {...stroke}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M21 14v7M17 21h-3" />
  </svg>,
  // Hotel & Reservation
  <svg key="i7" viewBox="0 0 24 24" {...stroke}>
    <path d="M3 20V8l9-4 9 4v12" />
    <path d="M3 20h18M9 20v-5h6v5" />
  </svg>,
];

export default function Services() {
  const { dict } = useLanguage();
  const services = dict.services;

  return (
    <section id="services" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{services.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {services.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{services.subtitle}</p>
        </Reveal>

        {/* Two-column grid of horizontal cards */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {services.items.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 90}>
              <article className="card card-hover group flex h-full items-start gap-5 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lavender-tint text-lavender transition-colors duration-300 group-hover:bg-lavender group-hover:text-white">
                  <span className="h-6 w-6">{ICONS[i]}</span>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {service.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {service.description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
