// POST /api/analytics/track — QR event kaydı (public; QR landing müşteri tarafından çağrılır).
// Body: { code, event: "qr_view" | "qr_click" | "qr_conversion", meta? }
//
// Şu an in-memory stub'a yazar (lib/db.ts). Production'da burada iki şey yapılır:
//   1. Event'i gerçek DB'ye insert et
//   2. İsteğe bağlı: GA4 Measurement Protocol'e forward et (bkz. README → GA4)

import type { NextApiRequest, NextApiResponse } from "next";
import { getCampaignByCode, trackEvent } from "../../../lib/db";
import type { AnalyticsEventName } from "../../../lib/types";

const EVENTS: AnalyticsEventName[] = ["qr_view", "qr_click", "qr_conversion"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, event, meta } = req.body || {};
  console.log(`[analytics] ${req.method} /api/analytics/track`, { code, event, meta });
  if (!EVENTS.includes(event)) {
    console.log(`[analytics] rejected: invalid event "${event}"`);
    return res
      .status(400)
      .json({ error: `event must be one of: ${EVENTS.join(", ")}` });
  }

  const campaign = getCampaignByCode(String(code || ""));
  if (!campaign) {
    console.log(`[analytics] rejected: unknown QR code "${code}"`);
    return res.status(404).json({ error: "Unknown QR code" });
  }

  const saved = trackEvent(
    campaign.id,
    campaign.merchantId,
    event,
    typeof meta === "object" && meta !== null ? meta : undefined
  );

  console.log(
    `[analytics] saved: ${event} → campaign=${campaign.id} merchant=${campaign.merchantId} eventId=${saved.id}`
  );
  return res.status(200).json({ ok: true, id: saved.id });
}
