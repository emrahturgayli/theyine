"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

/**
 * "Demo izle" CTA + modal with a lazy iframe. The iframe src is only set on
 * first open, so /demo/quiet-corner-sim.html costs nothing until requested.
 * Same-origin (served from public/), so no CSP/X-Frame-Options concerns.
 *
 * Analytics (gtag + dataLayer via lib/analytics track()):
 *   demo_click → CTA pressed · demo_open → modal shown · demo_close → dismissed
 */
const DEMO_SRC = "/demo/quiet-corner-sim.html";

export default function DemoModal() {
  const { dict } = useLanguage();
  const d = dict.qrPage.demo;
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState(""); // lazy: boş başlar, ilk açılışta dolar
  const closeRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    trackEvent("demo_click", "enterprise_qr_sim");
    setSrc(DEMO_SRC); // ilk tıklamada yükle, sonraki açılışlarda korunur
    setOpen(true);
    trackEvent("demo_open", "enterprise_qr_sim");
  };
  const hide = useCallback(() => {
    setOpen(false);
    trackEvent("demo_close", "enterprise_qr_sim");
  }, []);

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
          <div className="relative h-[min(88vh,860px)] w-[min(96vw,1100px)] overflow-hidden rounded-2xl border border-line bg-canvas shadow-lift">
            <button
              ref={closeRef}
              onClick={hide}
              aria-label={d.close}
              className="absolute right-3 top-3 z-10 rounded-full bg-panel/90 px-4 py-2 text-sm font-semibold text-white"
            >
              ✕ {d.close}
            </button>
            <iframe
              src={src}
              title={d.title}
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </section>
  );
}
