"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * DemoVideo — placeholder for the upcoming product walkthrough.
 * Shows a poster + "coming soon" badge today. To go live, replace the poster
 * block with an <iframe> (YouTube/Vimeo) inside the same aspect-video frame.
 */
export default function DemoVideo() {
  const { dict } = useLanguage();
  const t = dict.demoVideo;

  return (
    <section id="demo" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {t.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{t.subtitle}</p>
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-4xl">
          <div
            role="button"
            tabIndex={0}
            onClick={() => trackEvent("demo_play", "demo_video")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") trackEvent("demo_play", "demo_video");
            }}
            className="card relative aspect-video cursor-pointer overflow-hidden"
          >
            {/* Poster (bugün). Yayına alırken bu bloğu bir <iframe> ile değiştir:
                <iframe className="absolute inset-0 h-full w-full" src="https://www.youtube.com/embed/VIDEO_ID"
                  title={t.title} allow="accelerated-motion; encrypted-media" allowFullScreen /> */}
            <Image
              src="/assets/tryon/result.jpg"
              alt={t.title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-ink/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/15 text-white backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="rounded-full bg-lavender px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                {t.badge}
              </span>
              <span className="text-sm text-white/80">{t.caption}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
