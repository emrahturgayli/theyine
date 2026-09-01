"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * 60s walkthrough placeholder — no video is produced yet. Shows a poster
 * card with a "coming soon" badge instead of an embed, matching how
 * components/DemoVideo.tsx does the same thing on the main THEYINE site
 * (env-var-driven; leave NEXT_PUBLIC_BLOKMATE_DEMO_VIDEO_URL empty until a
 * real video exists — this component doesn't read that var itself yet,
 * it's a placeholder the way the spec asked for).
 */
export default function DemoVideo() {
  const { dict } = useBlokmateLanguage();
  const demo = dict.demo;

  return (
    <section className="border-b border-line py-20 md:py-28">
      <div className="container-shell">
        <div className="mx-auto max-w-xl text-center">
          <span className="eyebrow justify-center">{demo.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{demo.title}</h2>
          <p className="mt-4 text-lg text-ink-soft">{demo.subtitle}</p>
        </div>

        <div className="relative mx-auto mt-10 flex aspect-video w-full max-w-2xl items-center justify-center rounded-2xl border border-line bg-mist/60">
          <span className="absolute right-4 top-4 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-ink-faint">
            {demo.badge}
          </span>
          <button
            type="button"
            onClick={() => trackEvent("cta_click", "blokmate_demo_video")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lift transition-transform hover:scale-105"
            aria-label={demo.cta}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
