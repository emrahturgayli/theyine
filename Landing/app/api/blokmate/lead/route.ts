import { NextResponse } from "next/server";
import { getBlokmateSupabase, sendBlokmateEmail } from "@/lib/blokmate";

const VALID_SECTORS = new Set(["apartment", "office", "mixed", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTOR_LABELS: Record<string, string> = {
  apartment: "Apartman",
  office: "Ofis / Site",
  mixed: "Karma",
  other: "Diğer",
};

type LeadPayload = {
  buildingName: string;
  sector: string;
  website?: string;
  email: string;
};

type Lead = {
  buildingName: string;
  sector: string;
  website: string | null;
  email: string;
  submittedAt: string;
};

/**
 * BlokMate lead intake: validate -> insert into Supabase (`tenants`, status
 * "lead") -> send a confirmation email -> 200. Both the Supabase write and
 * the email are best-effort — Promise.allSettled below means a failure in
 * either is logged but never turns into a 500 for the visitor; whichever of
 * the two succeeds (or at minimum the console.log a few lines down) still
 * captures the lead.
 *
 * Required env vars — see .env.example:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (Supabase insert)
 *   SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT           (confirmation email)
 *   BLOKMATE_NOTIFICATION_EMAIL                          (internal notice)
 * All four are optional at the code level — each integration degrades to a
 * logged simulation/skip when unconfigured (see lib/blokmate.ts,
 * lib/email.ts) rather than failing the request. Never log the actual key
 * values, only whether they're present.
 */
export async function POST(request: Request) {
  let body: Partial<LeadPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const buildingName = typeof body.buildingName === "string" ? body.buildingName.trim() : "";
  const sector = typeof body.sector === "string" ? body.sector.trim() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!buildingName || buildingName.length > 200) {
    return NextResponse.json({ error: "invalid_building_name" }, { status: 400 });
  }
  if (!VALID_SECTORS.has(sector)) {
    return NextResponse.json({ error: "invalid_sector" }, { status: 400 });
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (website && website.length > 300) {
    return NextResponse.json({ error: "invalid_website" }, { status: 400 });
  }

  const lead: Lead = {
    buildingName,
    sector,
    website: website || null,
    email,
    submittedAt: new Date().toISOString(),
  };
  console.log("[blokmate-lead] new lead:", lead);

  const results = await Promise.allSettled([insertTenant(lead), sendLeadEmails(lead)]);
  const [insertResult, emailResult] = results;
  if (insertResult.status === "rejected") {
    console.error("[blokmate-lead] Supabase insert failed:", insertResult.reason);
  }
  if (emailResult.status === "rejected") {
    console.error("[blokmate-lead] confirmation email failed:", emailResult.reason);
  }

  return NextResponse.json({
    ok: true,
    message: "Talebiniz alındı. BlokMate ekibi kısa sürede sizinle iletişime geçecek.",
  });
}

async function insertTenant(lead: Lead): Promise<void> {
  const supabase = getBlokmateSupabase();
  if (!supabase) {
    console.warn(
      "[blokmate-lead] Supabase skipped: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set"
    );
    return;
  }

  const { error } = await supabase.from("tenants").insert({
    name: lead.buildingName,
    sector: lead.sector,
    website: lead.website,
    contact_email: lead.email,
    status: "lead",
  });
  if (error) throw new Error(error.message);
}

async function sendLeadEmails(lead: Lead): Promise<void> {
  await sendBlokmateEmail({
    to: lead.email,
    subject: "BlokMate — Talebiniz Alındı",
    body:
      `Merhaba,\n\n` +
      `Talebiniz alındı. BlokMate ekibi kısa sürede sizinle iletişime geçecek.\n\n` +
      `Bina: ${lead.buildingName}\n` +
      `Sektör: ${SECTOR_LABELS[lead.sector] ?? lead.sector}\n\n` +
      `BlokMate`,
  });

  const adminEmail = process.env.BLOKMATE_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.warn("[blokmate-lead] Admin notification skipped: BLOKMATE_NOTIFICATION_EMAIL not set");
    return;
  }
  await sendBlokmateEmail({
    to: adminEmail,
    subject: `Yeni BlokMate talebi: ${lead.buildingName}`,
    body:
      `Yeni bir demo talebi geldi.\n\n` +
      `Bina: ${lead.buildingName}\n` +
      `Sektör: ${SECTOR_LABELS[lead.sector] ?? lead.sector}\n` +
      `Website: ${lead.website ?? "-"}\n` +
      `E-posta: ${lead.email}\n` +
      `Zaman: ${lead.submittedAt}`,
  });
}
