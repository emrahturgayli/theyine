/**
 * Shared constants for the THEYINE QR subapp integration.
 *
 * Origin comes from NEXT_PUBLIC_QR_WIDGET_ORIGIN (set in Vercel): temporary
 * Vercel URL today, https://qr.theyine.com once the domain is attached —
 * switching is a config change + redeploy, not a code change.
 */
export const QR_WIDGET_ORIGIN =
  process.env.NEXT_PUBLIC_QR_WIDGET_ORIGIN || "https://theyine-tzyj.vercel.app";

/** Campaign showcased on marketing pages and the embedded widget. */
export const QR_DEMO_CAMPAIGN = "happy-hour-20-demo-2ohl";

/** Public landing URL of a campaign on the QR subapp. */
export const qrLandingUrl = (campaign: string) =>
  `${QR_WIDGET_ORIGIN}/r/${encodeURIComponent(campaign)}`;
