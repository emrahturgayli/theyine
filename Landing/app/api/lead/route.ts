import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import nodemailer from "nodemailer";

const VALID_SECTORS = new Set(["clinic", "education", "retail", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTOR_LABELS: Record<string, string> = {
  clinic: "Klinik",
  education: "Eğitim Kurumu",
  retail: "Esnaf / Perakende",
  other: "Diğer",
};

type LeadPayload = {
  businessName: string;
  sector: string;
  email: string;
};

type Lead = LeadPayload & { submittedAt: string };

// ---------------------------------------------------------------------------
// Apify — competitor / content intelligence scan (do not touch — working)
// ---------------------------------------------------------------------------

const apifyClient = process.env.APIFY_API_TOKEN
  ? new ApifyClient({ token: process.env.APIFY_API_TOKEN })
  : null;

/**
 * Kicks off the competitor/content scan for this lead. Prefers a saved Apify
 * Task (APIFY_TASK_ID — pre-configured input, easiest to manage from the
 * Apify Console) and falls back to running an Actor directly (APIFY_ACTOR_ID)
 * if that's what's configured instead.
 */
async function triggerApifyScan(lead: Lead): Promise<void> {
  if (!apifyClient) {
    console.warn("[lead-magnet] Apify skipped: APIFY_API_TOKEN not set");
    return;
  }

  const input = {
    businessName: lead.businessName,
    sector: lead.sector,
    // Free-text query an actual actor could hand to a search/scrape step.
    searchQuery: `${lead.businessName} ${SECTOR_LABELS[lead.sector] ?? lead.sector} Dupnitsa competitors`,
  };

  const taskId = process.env.APIFY_TASK_ID;
  const actorId = process.env.APIFY_ACTOR_ID;

  if (taskId) {
    await apifyClient.task(taskId).start(input);
    return;
  }

  if (actorId) {
    await apifyClient.actor(actorId).start(input);
    return;
  }

  console.warn(
    "[lead-magnet] Apify skipped: set APIFY_TASK_ID or APIFY_ACTOR_ID to enable the scan"
  );
}

// ---------------------------------------------------------------------------
// Email — nodemailer over SMTP (customer confirmation + internal notice)
// ---------------------------------------------------------------------------

const SMTP_CONFIGURED = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = SMTP_CONFIGURED
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

/**
 * Sends one email over SMTP. When SMTP_USER/SMTP_PASS aren't set yet (e.g.
 * local dev, or before the account is provisioned), this simulates the send
 * instead of throwing — the lead is still captured and the API still
 * returns 200, nothing crashes on a missing credential.
 */
async function sendEmail(params: { to: string; subject: string; body: string }): Promise<void> {
  if (!transporter) {
    console.log(
      `\x1b[32m[Email Simulation] Müşteriye ve Admine e-posta gönderildi sayıldı... (to: ${params.to}, subject: "${params.subject}")\x1b[0m`
    );
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: params.to,
    subject: params.subject,
    text: params.body,
  });
}

async function sendCustomerConfirmation(lead: Lead): Promise<void> {
  const sectorLabel = SECTOR_LABELS[lead.sector] ?? lead.sector;
  await sendEmail({
    to: lead.email,
    subject: "Talebiniz alındı — THEYINE Yapay Zeka Rakip Analizi",
    body:
      `Merhaba,\n\n` +
      `Talebiniz alındı. ${sectorLabel} sektöründeki rakipleriniz analiz ediliyor. ` +
      `Raporunuz 48 saat içinde bu adrese iletilecektir.\n\n` +
      `THEYINE`,
  });
}

async function sendAdminNotification(lead: Lead): Promise<void> {
  const adminEmail = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.warn(
      "[lead-magnet] Admin notification skipped: LEAD_NOTIFICATION_EMAIL not set"
    );
    return;
  }
  const sectorLabel = SECTOR_LABELS[lead.sector] ?? lead.sector;
  await sendEmail({
    to: adminEmail,
    subject: `Yeni lead: ${lead.businessName} (${sectorLabel})`,
    body:
      `Yeni bir rakip analizi talebi geldi.\n\n` +
      `İşletme: ${lead.businessName}\n` +
      `Sektör: ${sectorLabel}\n` +
      `E-posta: ${lead.email}\n` +
      `Zaman: ${lead.submittedAt}`,
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * Lead Magnet intake — "AI Competitor & Content Intelligence Report".
 * Validates the submission, then fans out to Apify (competitor scan) and
 * email (customer confirmation + internal notification) concurrently.
 * Each integration is isolated in its own try/catch: a failure there is
 * logged but never surfaces as a 500 to the visitor — the lead is still
 * captured either way.
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

  const lead: Lead = { businessName, sector, email, submittedAt: new Date().toISOString() };
  console.log("[lead-magnet] new lead:", lead);

  // Run all three integrations concurrently rather than sequentially — each
  // is independently wrapped so one failing (e.g. SMTP misconfigured) never
  // blocks or fails the others. Deliberately awaited (not detached) because
  // serverless functions can freeze immediately after the response is sent,
  // which would silently drop truly "fire-and-forget" work.
  const results = await Promise.allSettled([
    triggerApifyScan(lead),
    sendCustomerConfirmation(lead),
    sendAdminNotification(lead),
  ]);

  const [apifyResult, customerEmailResult, adminEmailResult] = results;
  if (apifyResult.status === "rejected") {
    console.error("[lead-magnet] Apify scan failed:", apifyResult.reason);
  }
  if (customerEmailResult.status === "rejected") {
    console.error("[lead-magnet] customer confirmation email failed:", customerEmailResult.reason);
  }
  if (adminEmailResult.status === "rejected") {
    console.error("[lead-magnet] admin notification email failed:", adminEmailResult.reason);
  }

  return NextResponse.json({ ok: true });
}
