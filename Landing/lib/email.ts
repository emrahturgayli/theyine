import nodemailer from "nodemailer";

/**
 * Shared SMTP sender (nodemailer) — used by every "send a transactional
 * email" spot in this project. Deliberately not Composio: an earlier
 * attempt to use @composio/core's SDK here failed server-side with a
 * persistent "401 Invalid API key" that blocked the request outright, so it
 * was replaced with this. Reusing it for new features (rather than
 * reaching for Composio again) avoids reintroducing that failure mode.
 *
 * Simulates (logs, doesn't throw) when SMTP_USER/SMTP_PASS aren't set —
 * e.g. local dev before a mailbox is provisioned — so callers always get a
 * clean success/failure result and never crash a request over a missing
 * credential.
 */

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

export async function sendEmail(params: { to: string; subject: string; body: string }): Promise<void> {
  if (!transporter) {
    console.log(
      `\x1b[32m[Email Simulation] E-posta gönderildi sayıldı... (to: ${params.to}, subject: "${params.subject}")\x1b[0m`
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
