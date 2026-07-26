// Bağımlılıksız, HMAC-SHA256 tabanlı minimal JWT implementasyonu.
// `jsonwebtoken` paketine gerek kalmadan Vercel serverless'ta çalışır.
// Merchant login → signToken; API route'lar → requireAuth middleware.

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

const SECRET = process.env.QR_SIGNING_SECRET || "dev-only-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gün

export interface TokenPayload {
  merchantId: string;
  email: string;
  exp: number;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64url");

function hmac(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function signToken(merchantId: string, email: string): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      merchantId,
      email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    } satisfies TokenPayload)
  );
  return `${header}.${payload}.${hmac(`${header}.${payload}`)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = hmac(`${header}.${payload}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as TokenPayload;
    if (data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * API route auth middleware. Başarısızsa 401 yazar ve null döner:
 *
 *   const auth = requireAuth(req, res);
 *   if (!auth) return;
 */
export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): TokenPayload | null {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return payload;
}
