// QR landing linklerinin tabanı: önce NEXT_PUBLIC_APP_URL, yoksa istekten türet
// (Vercel proxy'si x-forwarded-proto gönderir; lokalde http'ye düşer).

import type { NextApiRequest } from "next";

export function getBaseUrl(req: NextApiRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const proto = String(req.headers["x-forwarded-proto"] || "http");
  return `${proto}://${req.headers.host}`;
}
