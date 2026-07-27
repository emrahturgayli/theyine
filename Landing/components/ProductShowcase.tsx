"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import { trackEvent } from "@/lib/analytics";

/** Deterministic QR-look tile — decorative, matches the enterprise-qr hero. */
function QrGlyph() {
  const grid = 17;
  const cells: JSX.Element[] = [];
  const inFinder = (x: number, y: number) =>
    (x < 5 && y < 5) || (x >= grid - 5 && y < 5) || (x < 5 && y >= grid - 5);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (inFinder(x, y)) continue;
      if ((x * 31 + y * 17 + x * y) % 5 < 2) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={0.85} height={0.85} rx={0.18} />);
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
    <svg viewBox={`-1 -1 ${grid + 2} ${grid + 2}`} className="h-full w-full" fill="currentColor" aria-hidden>
      {finder(0, 0)}
      {finder(grid - 5, 0)}
      {finder(0, grid - 5)}
      {cells}
    </svg>
  );
}

/** Miniature phone frame showing a QR campaign landing — reuses the widget's own look. */
function QrMock() {
  return (
    <div className="relative mx-auto flex aspect-[4/3] max-w-md items-center justify-center rounded-xl2 border border-line bg-mist p-8 sm:p-10">
      <div className="absolute left-6 top-6 h-16 w-16 text-ink/70 sm:left-8 sm:top-8 sm:h-20 sm:w-20">
        <QrGlyph />
      </div>
      <div className="relative w-40 rounded-[1.6rem] border-4 border-ink/80 bg-canvas p-2 shadow-lift sm:w-48">
        <div className="absolute left-1/2 top-1 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink/60" />
        <div className="mt-3 rounded-xl bg-[#fffbeb] p-3 text-center">
          <div className="text-[0.55rem] font-bold uppercase tracking-widest text-amber-700">
            The Quiet Corner
          </div>
          <div className="mt-1 text-[0.7rem] font-extrabold leading-tight text-[#1c1917]">
            Chef&apos;s Tasting Evening
          </div>
          <div className="mt-2 rounded-lg bg-[#f59e0b] px-2 py-1.5 text-[0.55rem] font-bold text-[#1c1917]">
            Book a table →
          </div>
        </div>
      </div>
    </div>
  );
}

function TryOnMock() {
  return (
    <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-xl2 border border-line bg-mist">
      <Image
        src="/assets/tryon/result.jpg"
        alt="Automatically generated on-model product photo"
        fill
        sizes="(max-width: 768px) 100vw, 480px"
        className="object-cover object-top"
      />
      <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium text-ink shadow-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
        Automatically generated
      </span>
    </div>
  );
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  visual: "qr" | "tryon";
  reverse?: boolean;
  analyticsLabel: string;
}

export default function ProductShowcase({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  visual,
  reverse,
  analyticsLabel,
}: Props) {
  return (
    <section className="border-b border-line py-20 md:py-28">
      <div className="container-shell">
        <Reveal
          className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
            reverse ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
              {eyebrow}
            </span>
            <h2 className="mt-4 max-w-md text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
              {description}
            </p>
            <Link
              href={ctaHref}
              onClick={() => trackEvent("cta_click", analyticsLabel)}
              className="link-arrow mt-7 inline-flex"
            >
              {ctaLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div>{visual === "qr" ? <QrMock /> : <TryOnMock />}</div>
        </Reveal>
      </div>
    </section>
  );
}
