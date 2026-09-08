"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { trackEvent } from "@/lib/analytics";
import Dashboard from "./Dashboard";

/**
 * 60s walkthrough — no real video is produced yet, so the "player" is
 * the live Dashboard mockup (same component the page used to show in its
 * own section right after Hero) dimmed under a play overlay, rather than
 * a plain empty poster card. Moved directly under Hero (see
 * app/blokmate/page.tsx) so it's the first thing after the fold on
 * mobile — a static, dimmed screenshot-shaped area reads as more "there's
 * something to see here" than blank chrome, even before a real video
 * exists.
 */
export default function DemoVideo() {
  const { dict } = useBlokmateLanguage();
  const demo = dict.demo;

  return (
    <section className="border-b border-line py-16 md:py-20">
      <div className="container-shell">
        <div className="mx-auto max-w-xl text-center">
          <span className="eyebrow justify-center">{demo.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{demo.title}</h2>
          <p className="mt-4 text-lg text-ink-soft">{demo.subtitle}</p>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-line shadow-lift">
          {/* Dimmed, non-interactive backdrop — decorative only, the real content is the play button below. */}
          <div className="pointer-events-none scale-105 opacity-40 blur-[1px]" aria-hidden>
            <Dashboard />
          </div>

          <span className="absolute right-4 top-4 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-ink-faint">
            {demo.badge}
          </span>

          <button
            type="button"
            onClick={() => trackEvent("cta_click", "blokmate_demo_video")}
            aria-label={demo.cta}
            className="absolute inset-0 flex items-center justify-center bg-ink/10 transition-colors hover:bg-ink/20 focus-visible:bg-ink/20"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lift transition-transform hover:scale-105">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
