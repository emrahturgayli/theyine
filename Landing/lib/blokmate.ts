import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

/**
 * BlokMate's shared server-side helpers: the Supabase client and the
 * transactional-email placeholder. Server-only — SUPABASE_SERVICE_ROLE_KEY
 * bypasses Row Level Security, so never import this into client code, and
 * never log the key itself.
 */

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

let cachedClient: SupabaseClient | null | undefined;

/**
 * Returns null (not a throw) when unconfigured — callers log-and-skip
 * rather than crash the request, matching this codebase's existing
 * simulation-fallback convention (see lib/email.ts).
 *
 * NEXT_PUBLIC_SUPABASE_URL is reused here even though this is server-only:
 * it's not a secret (the anon-key pattern already assumes the URL is
 * public), and keeping one URL var instead of two (a public one for
 * client-side Supabase usage later, a private one for this) avoids drift
 * between them.
 */
export function getBlokmateSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * TODO(composio): the spec for this module asks for Composio's
 * transactional-email API specifically. Left as a placeholder rather than
 * wired up: an earlier attempt to use @composio/core's SDK in this same
 * codebase (app/api/lead/route.ts, since replaced) failed server-side with
 * a persistent "401 Invalid API key" that blocked every request. Re-adding
 * it here would risk the same failure mode for BlokMate's lead flow.
 *
 * sendBlokmateEmail() below uses the SMTP sender (lib/email.ts) that
 * replaced Composio and is proven working in production — swap it for a
 * real Composio call once COMPOSIO_API_KEY is confirmed valid for this
 * account, or once the 401 is otherwise root-caused.
 */
export async function sendBlokmateEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  await sendEmail(params);
}
