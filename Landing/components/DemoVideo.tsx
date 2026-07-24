"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * DemoVideo — product walkthrough.
 * Editorial split: caption column carries the claim, the frame runs wide
 * beside it with the play control anchored to its corner.
 *
 * Set NEXT_PUBLIC_DEMO_VIDEO_URL (a normal YouTube or Vimeo link) to go live.
 * Until then the frame stays a poster with the "coming soon" badge.
 * The player is a facade: the iframe only mounts on click, so the embed never
 * costs anything on first paint.
 */

const VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

/** Turns a share link into an autoplaying embed URL. Returns null if unusable. */
function toEmbedUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function DemoVideo() {
  const { dict } = useLanguage();
  const t = dict.demoVideo;

  const embedUrl = toEmbedUrl(VIDEO_URL);
  const [playing, setPlaying] = useState(false);

  function play() {
    trackEvent("demo_play", "demo_video");
    if (embedUrl) setPlaying(true);
  }

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

          {/* "Coming soon" only while no video is configured. */}
          {!embedUrl && (
            <div className="mt-10 hidden items-center gap-3 border-t border-line pt-6 lg:flex">
              <span className="rounded-full bg-lavender px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                {t.badge}
              </span>
              <span className="text-sm text-ink-faint">{t.caption}</span>
            </div>
          )}
        </Reveal>

        <Reveal className="lg:col-span-8" delay={80}>
          <div className="card relative aspect-video overflow-hidden shadow-lift">
            {playing && embedUrl ? (
              <iframe
                src={embedUrl}
                title={t.title}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label={t.title}
                onClick={play}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    play();
                  }
                }}
                className="absolute inset-0 cursor-pointer"
              >
                <Image
                  src="/assets/tryon/result.jpg"
                  alt={t.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover object-top opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

                <span className="absolute bottom-6 left-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 hover:scale-105">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>

                {!embedUrl && (
                  <div className="absolute bottom-8 left-28 right-6 flex flex-col gap-1 lg:hidden">
                    <span className="w-fit rounded-full bg-lavender px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                      {t.badge}
                    </span>
                    <span className="text-sm text-white/80">{t.caption}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
