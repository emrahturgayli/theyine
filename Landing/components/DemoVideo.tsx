"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * DemoVideo — placeholder for the upcoming product walkthrough.
 * Editorial split: caption column carries the claim, the frame runs wide
 * beside it with the play control anchored to its corner rather than
 * floating centered. Shows a poster + "coming soon" badge today. To go
 * live, replace the poster block with an <iframe> (YouTube/Vimeo) inside
 * the same aspect-video frame.
 */
export default function DemoVideo() {
  const { dict } = useLanguage();
  const t = dict.demoVideo;

  return (
    <section id="demo" className="border-b border-line py-24 md:py-section">
      <div className="container-shell grid gap-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4 lg:pt-2">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {t.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight text-ink md:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 max-w-sm text-lg text-ink-soft">{t.subtitle}</p>

          <div className="mt-10 hidden items-center gap-3 border-t border-line pt-6 lg:flex">
            <span className="rounded-full bg-lavender px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              {t.badge}
            </span>
            <span className="text-sm text-ink-faint">{t.caption}</span>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-8" delay={80}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => trackEvent("demo_play", "demo_video")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") trackEvent("demo_play", "demo_video");
            }}
            className="card relative aspect-video cursor-pointer overflow-hidden shadow-lift"
          >
            {/* Poster (bugün). Yayına alırken bu bloğu bir <iframe> ile değiştir:
                <iframe className="absolute inset-0 h-full w-full" src="https://www.youtube.com/embed/VIDEO_ID"
                  title={t.title} allow="accelerated-motion; encrypted-media" allowFullScreen /> */}
            <Image
              src="/assets/tryon/result.jpg"
              alt={t.title}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

            <span className="absolute bottom-6 left-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/15 text-white backdrop-blur-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>

            <div className="absolute bottom-8 left-28 right-6 flex flex-col gap-1 lg:hidden">
              <span className="w-fit rounded-full bg-lavender px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
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
