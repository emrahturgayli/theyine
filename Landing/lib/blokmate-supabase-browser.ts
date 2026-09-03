"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlokmateJwtClaims } from "@/lib/blokmate";

/**
 * Browser-side Supabase client for BlokMate — uses the publishable anon
 * key, so every query made through this client is subject to the RLS
 * policies in supabase/migrations/002_add_tenant_id_and_rls.sql. Unlike
 * lib/blokmate.ts's service-role client, this one is safe to import into
 * client components; it can never see another tenant's rows because
 * Postgres enforces that, not application code.
 *
 * Returns null when unconfigured, matching this codebase's existing
 * graceful-degradation convention (see getBlokmateSupabase in
 * lib/blokmate.ts).
 */
let cachedBrowserClient: SupabaseClient | null | undefined;

export function getBlokmateSupabaseBrowser(): SupabaseClient | null {
  if (cachedBrowserClient !== undefined) return cachedBrowserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    cachedBrowserClient = null;
    return cachedBrowserClient;
  }

  cachedBrowserClient = createClient(url, anonKey);
  return cachedBrowserClient;
}

/**
 * Reads the tenant_id/role claims off the current session's access token.
 * Returns null if there's no session or the hook (see migration 002,
 * Part 4) hasn't been enabled yet — every caller must treat that as "no
 * tenant context", not throw, since an unconfigured hook is a valid
 * (if incomplete) deployment state.
 */
export async function getBlokmateSessionClaims(): Promise<BlokmateJwtClaims | null> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  return parseBlokmateClaims(session.access_token);
}

/**
 * Pure decode, exported so both getBlokmateSessionClaims() and the
 * onAuthStateChange listener in lib/blokmate-auth-context.tsx can read
 * claims off a token they already have in hand, without an extra
 * getSession() round-trip.
 */
export function parseBlokmateClaims(accessToken: string): BlokmateJwtClaims | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload || typeof payload.tenant_id !== "string" || typeof payload.blokmate_role !== "string") {
    return null;
  }
  return { tenant_id: payload.tenant_id, role: payload.blokmate_role as BlokmateJwtClaims["role"] };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}
