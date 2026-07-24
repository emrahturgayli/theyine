/**
 * GA4 + provider-agnostic event tracking. The <Analytics /> component loads
 * gtag.js with this ID; track() then sends to GA4 (gtag) and GTM (dataLayer).
 */
// Env override, with a safe literal fallback. Empty string => analytics no-ops.
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ?? "G-2NWHGKF2QX";

type Props = Record<string, unknown>;

/**
 * Low-level push. Safe no-op on the server and when no analytics layer is
 * present (e.g. dev, where <Analytics /> doesn't load gtag).
 */
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

/**
 * Standard THEYINE event: fixed category, action = GA4 event name, optional
 * label. Emits { event: <action>, category, action, label, ...extra }.
 */
export function trackEvent(action: string, label?: string, extra: Props = {}): void {
  track(action, {
    category: "theyine_tryon",
    action,
    ...(label ? { label } : {}),
    ...extra,
  });
}
