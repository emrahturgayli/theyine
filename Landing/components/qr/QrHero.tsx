"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";
import { QR_DEMO_CAMPAIGN, qrLandingUrl } from "@/lib/qr";

/**
 * Enterprise QR hero — same editorial masthead language as the try-on page:
 * oversized claim across the top band, supporting copy and CTAs on the right,
 * proof spread beneath. The "proof" here is a decorative QR tile (the product
 * itself) that links to the live demo campaign, with metrics beside it.
 */

/** Deterministic QR-look pattern — decorative only, not scannable. */
function QrTile() {
  const grid = 17;
  const cells: JSX.Element[] = [];
  const inFinder = (x: number, y: number) =>
    (x < 5 && y < 5) || (x >= grid - 5 && y < 5) || (x < 5 && y >= grid - 5);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (inFinder(x, y)) continue;
      if ((x * 31 + y * 17 + x * y) % 5 < 2) {
        cells.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={0.85} height={0.85} rx={0.18} />
        );
      }
    }
  }
  const finder = (fx: number, fy: number) => (
    <g key={`f${fx}-${fy}`}>
      <rect x={fx} y={fy} width={5} height={5} rx={0.6} fill="none" stroke="currentColor" strokeWidth={0.85} />
      <rect x={fx + 1.6} y={fy + 1.6} width={1.8} height={1.8} rx={0.35} />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${grid + 2} ${grid + 2}`} className="h-full w-full text-ink" fill="currentColor" aria-hidden>
      {finder(0, 0)}
      {finder(grid - 5, 0)}
      {finder(0, grid - 5)}
      {cells}
    </svg>
  );
}

export default function QrHero() {
  const { dict } = useLanguage();
  const h = dict.qrPage.hero;
  const demoUrl = qrLandingUrl(QR_DEMO_CAMPAIGN);

  return (
    <section
      id="qr-hero"
      className="relative overflow-hidden border-b border-line pt-24 pb-0 md:pt-32"
    >
      {/* Ambient field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-80 w-80 rounded-full bg-lavender-soft/35 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(var(--line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 60% 45% at 20% 20%, #000 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 45% at 20% 20%, #000 30%, transparent 100%)",
          }}
        />
      </div>

      <div className="container-shell">
        {/* Masthead */}
        <div className="grid gap-10 border-b border-line pb-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
              {h.eyebrow}
            </span>
            <h1 className="mt-6 max-w-[17ch] text-5xl font-bold leading-[0.98] tracking-tightest text-ink sm:text-6xl lg:text-7xl">
              {h.title}
            </h1>
          </div>

          <div className="flex flex-col justify-end gap-8 lg:col-span-4">
            <p className="max-w-md text-lg leading-relaxed text-ink-soft">
              {h.subtitle}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("cta_click", "qr_hero_live_demo")}
                className="btn-primary w-full sm:w-auto"
              >
                {h.ctaPrimary}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="#contact"
                onClick={() => trackEvent("cta_click", "qr_hero_start_project")}
                className="btn-secondary w-full sm:w-auto"
              >
                {h.ctaSecondary}
              </a>
            </div>
          </div>
        </div>

        {/* Proof spread — QR tile links to the live demo, metrics sit beside it */}
        <div className="relative grid gap-10 py-16 lg:grid-cols-12 lg:items-end lg:gap-6">
          <figure className="relative -mt-24 lg:col-span-5 lg:-mt-32">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("cta_click", "qr_hero_tile")}
              className="card block overflow-hidden p-8 shadow-lift transition-transform hover:-translate-y-1 sm:p-10"
              aria-label={h.ctaPrimary}
            >
              <div className="mx-auto aspect-square max-w-[18rem]">
                <QrTile />
              </div>
            </a>
            <figcaption className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-ink shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
              {h.demoTag}
            </figcaption>
          </figure>

          <dl className="grid grid-cols-3 gap-x-6 gap-y-8 lg:col-span-7 lg:pl-6">
            {h.metrics.map((m) => (
              <div key={m.label} className="border-l border-line pl-4">
                <dt className="text-2xl font-semibold tracking-tight text-ink [font-variant-numeric:tabular-nums] lg:text-3xl">
                  {m.value}
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-faint">
                  {m.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
