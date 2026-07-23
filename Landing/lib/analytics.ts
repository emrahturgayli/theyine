/**
 * Provider-agnostic event tracking. No-ops on the server and when no analytics
 * layer is present. Sends to GA4 (gtag) and/or GTM (dataLayer) if either exists.
 */
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
