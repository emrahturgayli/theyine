/**
 * GA4 + provider-agnostic event tracking. The <Analytics /> component loads
 * gtag.js with this ID; track() then sends to GA4 (gtag) and GTM (dataLayer).
 */
export const GA_MEASUREMENT_ID = "G-6LH347WTRK";

type Props = Record<string, unknown>;

export function track(event: string, props: Props = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  if (typeof w.gtag === "function") w.gtag("event", event, props);
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...props });
}
