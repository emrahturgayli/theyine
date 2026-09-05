"use client";

import { getBlokmateSupabaseBrowser, getBlokmateSessionClaims } from "@/lib/blokmate-supabase-browser";

const BUCKET = "blokmate-attachments";

/**
 * Object path convention lives here and in
 * supabase/migrations/011_phase5_storage_and_tickets.sql's storage RLS —
 * {tenant_id}/{folder}/{random}-{filename}. The tenant_id prefix is what
 * every storage.objects policy parses back out with split_part(); folder
 * is 'announcements' or 'tickets' (the resident-upload policy only allows
 * the latter).
 */
async function buildAttachmentPath(folder: "announcements" | "tickets", file: File): Promise<string> {
  const claims = await getBlokmateSessionClaims();
  if (!claims) throw new Error("Tenant bilgisi bulunamadı — lütfen tekrar giriş yapın.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${claims.tenant_id}/${folder}/${crypto.randomUUID()}-${safeName}`;
}

/**
 * Uploads to the private blokmate-attachments bucket and returns the
 * storage path (NOT a public URL — the bucket has public=false, so a
 * direct URL would 403). Store this path in announcements.attachment_url
 * / tickets.attachment_url; resolve it to something fetchable with
 * getBlokmateAttachmentUrl() at render time.
 */
export async function uploadBlokmateAttachment(folder: "announcements" | "tickets", file: File): Promise<string> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");
  const path = await buildAttachmentPath(folder, file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/**
 * Short-lived signed URL for displaying/downloading an attachment. Called
 * at render time rather than cached, since a stored path never expires
 * but a signed URL does (1 hour here).
 */
export async function getBlokmateAttachmentUrl(path: string): Promise<string> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
