"use client";

import Link from "next/link";
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

// Destination per card, index-aligned with `services.items` (and ICONS above).
// Most studio capabilities don't have a standalone page yet and route to the
// contact section. Three now have live product pages: Content & UGC Systems
// routes to the AI Video Studio (the closest real product to that capability),
// QR Menu & Restaurant to its product page. Hotel & Reservation is on the
// roadmap: contact destination, marked as such so the card doesn't imply a
// product page that doesn't exist yet.
const HREFS = [
  "#contact",
  "#contact",
  "#contact",
  "#contact",
  "#contact",
  "/studio",
  "/enterprise-qr",
  "#contact",
];
const COMING_SOON = [false, false, false, false, false, false, false, true];

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

        {/* Two-column grid of horizontal cards — the whole card is the link */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {services.items.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 90}>
              <Link
                href={HREFS[i]}
                className="card card-hover group flex h-full items-start gap-5 p-6 outline-none transition-transform duration-300 hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lavender-tint text-lavender transition-colors duration-300 group-hover:bg-lavender group-hover:text-white">
                  <span className="h-6 w-6">{ICONS[i]}</span>
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-ink">
                      {service.title}
                    </h3>
                    {COMING_SOON[i] && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-faint">
                        {services.comingSoon}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {service.description}
                  </p>
                </div>
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
                  className="mt-1 shrink-0 text-ink-faint opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-lavender group-hover:opacity-100"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
