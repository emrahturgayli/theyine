// POST /api/qr — yeni QR kampanyası oluşturur (auth zorunlu).
// Body: { title, description?, type, targetUrl?, expiresAt?, tags?, code? }
// Dönüş: kampanya objesi + tam QR landing URL'i.

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../lib/auth";
import { createCampaign, getCampaignByCode } from "../../../lib/db";
import { getBaseUrl } from "../../../lib/url";
import type { CampaignType } from "../../../lib/types";

const TYPES: CampaignType[] = ["menu", "reservation", "order"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  const { title, description, type, targetUrl, expiresAt, tags, code } =
    req.body || {};

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!TYPES.includes(type)) {
    return res
      .status(400)
      .json({ error: `type must be one of: ${TYPES.join(", ")}` });
  }
  if (targetUrl) {
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "targetUrl is not a valid URL" });
    }
  }
  if (code && getCampaignByCode(String(code))) {
    return res.status(409).json({ error: "code already in use" });
  }

  const campaign = createCampaign({
    merchantId: auth.merchantId,
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    type,
    targetUrl: typeof targetUrl === "string" ? targetUrl.trim() : "",
    expiresAt: typeof expiresAt === "string" && expiresAt ? expiresAt : undefined,
    tags: Array.isArray(tags)
      ? tags.map(String).map((t) => t.trim()).filter(Boolean)
      : [],
    code: typeof code === "string" ? code : undefined,
  });

  const base = getBaseUrl(req);
  return res
    .status(201)
    .json({ ...campaign, qrUrl: `${base}/r/${campaign.code}` });
}
