import { NextResponse } from "next/server";

const VALID_SECTORS = new Set(["clinic", "education", "retail", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  businessName: string;
  sector: string;
  email: string;
};

/**
 * Lead Magnet intake — "AI Competitor & Content Intelligence Report".
 * Currently just validates and logs; the Apify scrape job and the
 * Composio-driven report delivery get wired in here next.
 */
export async function POST(request: Request) {
  let body: Partial<LeadPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";
  const sector = typeof body.sector === "string" ? body.sector.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!businessName || businessName.length > 200) {
    return NextResponse.json({ error: "invalid_business_name" }, { status: 400 });
  }
  if (!VALID_SECTORS.has(sector)) {
    return NextResponse.json({ error: "invalid_sector" }, { status: 400 });
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const lead = {
    businessName,
    sector,
    email,
    submittedAt: new Date().toISOString(),
  };

  // TODO: trigger Apify competitor/content scrape + Composio report delivery.
  console.log("[lead-magnet] new lead:", lead);

  return NextResponse.json({ ok: true });
}
