// POST /api/auth/login — merchant girişi. Başarılıysa 7 gün geçerli JWT döner.
// Body: { email, password }  →  { token, merchantId, restaurantName }

import type { NextApiRequest, NextApiResponse } from "next";
import { findMerchantByEmail } from "../../../lib/db";
import { signToken } from "../../../lib/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  const merchant = findMerchantByEmail(email);
  if (!merchant || merchant.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.status(200).json({
    token: signToken(merchant.id, merchant.email),
    merchantId: merchant.id,
    restaurantName: merchant.restaurantName,
  });
}
