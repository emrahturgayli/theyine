"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * "Demo izle" CTA + modal with a lazily loaded YouTube embed. The iframe src
 * is only set on first open, so nothing is fetched until requested.
 *
 * Analytics (gtag + dataLayer via lib/analytics track()):
 *   demo_click → CTA pressed · demo_open → modal shown · demo_close → dismissed
 *   demo_play  → video actually started (YouTube IFrame API onStateChange)
 *
 * The interactive simulation remains archived at /demo/quiet-corner-sim.html.
 */
const VIDEO_ID = "nc5gWpxI6IM";
const IFRAME_ID = "demoIframe";

// YouTube IFrame API — minimal surface we use.
type YTPlayer = { destroy?: () => void };
type YTNamespace = {
  Player: new (
    id: string,
    opts: { events: { onStateChange: (e: { data: number }) => void } }
  ) => YTPlayer;
  PlayerState: { PLAYING: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** API script'ini bir kez yükler; hazır olunca resolve eder. */
let ytReady: Promise<YTNamespace> | null = null;
function loadYouTubeAPI(): Promise<YTNamespace> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT as YTNamespace);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return ytReady;
}

export default function DemoModal() {
  const { dict } = useLanguage();
  const d = dict.qrPage.demo;
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState(""); // lazy: boş başlar, ilk açılışta dolar
  const closeRef = useRef<HTMLButtonElement>(null);
  const playedRef = useRef(false); // demo_play oturum başına bir kez

  const show = () => {
    trackEvent("demo_click", "enterprise_qr_youtube");
    // enablejsapi + origin: IFrame API'nin onStateChange event'leri için şart
    setSrc(
      `https://www.youtube.com/embed/${VIDEO_ID}` +
        `?rel=0&modestbranding=1&autoplay=1&enablejsapi=1` +
        `&origin=${encodeURIComponent(window.location.origin)}`
    );
    setOpen(true);
    trackEvent("demo_open", "enterprise_qr_youtube");
  };
  const hide = useCallback(() => {
    setOpen(false);
    trackEvent("demo_close", "enterprise_qr_youtube");
  }, []);

  // Modal her açılışında player'ı iframe'e bağla; PLAYING → demo_play
  useEffect(() => {
    if (!open || !src) return;
    let player: YTPlayer | undefined;
    let cancelled = false;
    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(IFRAME_ID, {
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING && !playedRef.current) {
              playedRef.current = true;
              trackEvent("demo_play", "enterprise_qr_youtube");
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy?.();
    };
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, hide]);

  return (
    <section className="border-b border-line py-16 md:py-24">
      <div className="container-shell text-center">
        <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {d.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">{d.subtitle}</p>
        <button id="openDemo" onClick={show} className="btn-primary mt-8">
          {d.watch}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={d.title}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && hide()}
        >
          <div className="relative aspect-video w-[min(96vw,1100px)] max-h-[88vh] overflow-hidden rounded-2xl border border-line bg-black shadow-lift">
            <button
              ref={closeRef}
              onClick={hide}
              aria-label={d.close}
              className="absolute right-3 top-3 z-10 rounded-full bg-panel/90 px-4 py-2 text-sm font-semibold text-white"
            >
              ✕ {d.close}
            </button>
            <iframe
              id={IFRAME_ID}
              src={src}
              title={d.title}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
          </div>
        </div>
      )}
    </section>
  );
}
