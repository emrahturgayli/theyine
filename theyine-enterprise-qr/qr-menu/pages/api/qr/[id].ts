// GET /api/qr/:id — tek bir QR kampanyasının detayını döner (auth zorunlu).
// Yalnızca kampanyanın sahibi olan merchant erişebilir.

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../lib/auth";
import { getCampaign } from "../../../lib/db";
import { getBaseUrl } from "../../../lib/url";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  const campaign = getCampaign(String(req.query.id));
  if (!campaign || campaign.merchantId !== auth.merchantId) {
    return res.status(404).json({ error: "Not found" });
  }

  const base = getBaseUrl(req);
  return res.status(200).json({ ...campaign, qrUrl: `${base}/r/${campaign.code}` });
}
