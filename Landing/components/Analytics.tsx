import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Google Analytics 4 (gtag.js), rendered as plain script tags inside <head>.
 *
 * Deliberately NOT next/script: `afterInteractive` injects only after
 * hydration, so the tag is missing from the server HTML (and from view-source).
 * Server-rendering the standard GA snippet guarantees it is in the live DOM.
 * gtag() is defined globally here, which is what lib/analytics.ts track() uses.
 */
export default function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        id="ga4-init"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
        }}
      />
    </>
  );
}
