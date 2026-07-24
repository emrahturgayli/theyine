import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Loads Google Analytics 4 (gtag.js) after the page is interactive.
 * Defines the global gtag() so lib/analytics.ts `track()` reaches GA4.
 * Page views are auto-tracked; custom events flow via track().
 */
export default function Analytics() {
  // No-op in dev or when no ID — keeps analytics out of local/preview traffic.
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
