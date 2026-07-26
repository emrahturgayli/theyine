"use client";

import { useEffect } from "react";

/**
 * THEYINE QR embed widget — loads the qr subapp's /embed.js as a floating
 * button + iframe panel (bottom-right).
 *
 * Injection is deferred to browser idle time so it never competes with the
 * page's first paint; embed.js itself lazy-loads the iframe on first click,
 * so no request hits the QR subapp unless the visitor opens the widget.
 *
 * Origin comes from NEXT_PUBLIC_QR_WIDGET_ORIGIN (set it in Vercel):
 * temporary Vercel URL today, https://qr.theyine.com once the domain is
 * attached — switching is a config change + redeploy, not a code change.
 */
const WIDGET_ORIGIN =
  process.env.NEXT_PUBLIC_QR_WIDGET_ORIGIN || "https://theyine-tzyj.vercel.app";
const SCRIPT_ID = "theyine-qr-embed";

export default function QRWidget({ campaign }: { campaign: string }) {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    const inject = () => {
      if (document.getElementById(SCRIPT_ID)) return;
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = `${WIDGET_ORIGIN}/embed.js`;
      s.async = true;
      s.dataset.campaign = campaign;
      s.dataset.baseUrl = WIDGET_ORIGIN;
      // The site's theme toggle writes <html class="dark"> — mirror it so the
      // widget's landing renders in the same theme (picked up at inject time).
      s.dataset.theme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      document.body.appendChild(s);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(inject, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    // Safari fallback: short delay keeps it off the critical path.
    const t = setTimeout(inject, 2000);
    return () => clearTimeout(t);
  }, [campaign]);

  return null; // no visual output — embed.js appends its own DOM to <body>
}
