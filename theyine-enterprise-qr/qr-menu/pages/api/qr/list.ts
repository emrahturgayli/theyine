// GET /api/qr/list — merchant'a ait tüm QR kampanyaları + istatistikler (auth zorunlu).
// Dashboard grafiği için son 7 günün günlük tarama sayılarını da (`last7`) içerir.

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../lib/auth";
import { last7DayViews, listCampaigns } from "../../../lib/db";
import { getBaseUrl } from "../../../lib/url";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  const base = getBaseUrl(req);
  const campaigns = listCampaigns(auth.merchantId).map((c) => ({
    ...c,
    qrUrl: `${base}/r/${c.code}`,
  }));

  return res.status(200).json({
    campaigns,
    last7: last7DayViews(auth.merchantId),
  });
}
