"use client";

import { getBlokmateSupabaseBrowser, getBlokmateSessionClaims } from "@/lib/blokmate-supabase-browser";

/**
 * Onboarding hierarchy this file implements: Site (tenants) -> Building
 * (buildings) -> Unit (units) -> Resident (users). See
 * supabase/migrations/014_onboarding_invites_and_directory.sql for the
 * schema/RLS this all rests on.
 *
 * Two resident onboarding paths, both landing in
 * resident_signup_requests (never directly in `users`) until a manager
 * approves:
 *   A) Invite token/link — createInviteToken() (manager) ->
 *      getPublicInviteByToken() (anonymous invitee) -> submitResidentSignupRequest().
 *   B) Dropdown — listPublicTenants/Buildings/Units() (anonymous, cascading
 *      pickers) -> submitResidentSignupRequest().
 */

export type InviteToken = {
  id: string;
  tenant_id: string;
  building_id: string;
  unit_id: string | null;
  token: string;
  status: "active" | "revoked";
  expires_at: string | null;
  created_at: string;
};

export type PublicInvite = {
  id: string;
  tenant_id: string;
  building_id: string;
  unit_id: string | null;
  tenantName: string;
  buildingName: string;
  unitLabel: string | null;
};

export type ResidentSignupRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  building_id: string;
  unit_id: string | null;
  invite_token_id: string | null;
  full_name: string;
  phone: string | null;
  email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function client() {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");
  return supabase;
}

// ---------------------------------------------------------------------------
// Manager: invite tokens
// ---------------------------------------------------------------------------

export async function listInviteTokens(): Promise<InviteToken[]> {
  const { data, error } = await client()
    .from("invite_tokens")
    .select("id, tenant_id, building_id, unit_id, token, status, expires_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInviteToken(input: {
  building_id: string;
  unit_id?: string;
  expires_at?: string;
}): Promise<InviteToken> {
  const claims = await getBlokmateSessionClaims();
  if (!claims) throw new Error("Tenant bilgisi bulunamadı — lütfen tekrar giriş yapın.");
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const token = crypto.randomUUID().replace(/-/g, "");
  const { data, error } = await supabase
    .from("invite_tokens")
    .insert({
      tenant_id: claims.tenant_id,
      building_id: input.building_id,
      unit_id: input.unit_id || null,
      token,
      expires_at: input.expires_at || null,
      created_by: user?.id ?? null,
    })
    .select("id, tenant_id, building_id, unit_id, token, status, expires_at, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function revokeInviteToken(id: string): Promise<void> {
  const { error } = await client().from("invite_tokens").update({ status: "revoked" }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Public directory (anonymous-readable — see the view comments in
// migration 014 for why this is safe: id + display name only)
// ---------------------------------------------------------------------------

export async function listPublicTenants(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await client().from("public_tenants").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPublicBuildings(tenantId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await client()
    .from("public_buildings")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPublicUnits(buildingId: string): Promise<{ id: string; label: string }[]> {
  const { data, error } = await client()
    .from("public_units")
    .select("id, label")
    .eq("building_id", buildingId)
    .order("label");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Resolves an invite link's token to display-ready site/building/unit names. Returns null for an invalid/expired/revoked token. */
export async function getPublicInviteByToken(token: string): Promise<PublicInvite | null> {
  const supabase = client();
  const { data: invite, error } = await supabase
    .from("invite_tokens")
    .select("id, tenant_id, building_id, unit_id")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invite) return null;

  const [{ data: tenant }, { data: building }, unitResult] = await Promise.all([
    supabase.from("public_tenants").select("name").eq("id", invite.tenant_id).maybeSingle(),
    supabase.from("public_buildings").select("name").eq("id", invite.building_id).maybeSingle(),
    invite.unit_id
      ? supabase.from("public_units").select("label").eq("id", invite.unit_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: invite.id,
    tenant_id: invite.tenant_id,
    building_id: invite.building_id,
    unit_id: invite.unit_id,
    tenantName: tenant?.name ?? "—",
    buildingName: building?.name ?? "—",
    unitLabel: (unitResult as { data: { label: string } | null }).data?.label ?? null,
  };
}

// ---------------------------------------------------------------------------
// Resident: submit + check signup request
// ---------------------------------------------------------------------------

/**
 * Called right after supabase.auth.signUp() — the new session has no
 * tenant_id/blokmate_role claim yet (nothing in `users` for the hook to
 * read), which is fine here: resident_signup_requests_insert_self RLS
 * (migration 014) only requires the row's user_id match the caller.
 */
export async function submitResidentSignupRequest(input: {
  user_id: string;
  tenant_id: string;
  building_id: string;
  unit_id?: string | null;
  invite_token_id?: string | null;
  full_name: string;
  phone?: string;
  email: string;
}): Promise<void> {
  const { error } = await client()
    .from("resident_signup_requests")
    .insert({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      building_id: input.building_id,
      unit_id: input.unit_id || null,
      invite_token_id: input.invite_token_id || null,
      full_name: input.full_name,
      phone: input.phone || null,
      email: input.email,
    });
  if (error) throw new Error(error.message);
}

/** For the "awaiting approval" screen — the caller's own most recent request, if any. */
export async function getOwnSignupRequest(): Promise<ResidentSignupRequest | null> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("resident_signup_requests")
    .select("id, user_id, tenant_id, building_id, unit_id, invite_token_id, full_name, phone, email, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// Manager: review pending requests
// ---------------------------------------------------------------------------

export async function listPendingSignupRequests(): Promise<ResidentSignupRequest[]> {
  const { data, error } = await client()
    .from("resident_signup_requests")
    .select("id, user_id, tenant_id, building_id, unit_id, invite_token_id, full_name, phone, email, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Approves a pending request: inserts the real `users` row (the actual
 * privilege grant — gated by users_insert RLS's existing
 * blokmate_jwt_role() = 'manager' check, migration 002, unchanged here)
 * and marks the request approved. Not wrapped in a transaction (no RPC
 * for that exists), same accepted pattern as markInvoicePaid — if the
 * second write fails, the resident is already provisioned and usable;
 * the request just stays "pending" for a manager to notice and re-mark.
 */
export async function approveSignupRequest(
  request: Pick<ResidentSignupRequest, "id" | "user_id" | "tenant_id" | "full_name" | "email" | "unit_id">,
  unitId?: string
): Promise<void> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: userInsertError } = await supabase.from("users").insert({
    id: request.user_id,
    tenant_id: request.tenant_id,
    full_name: request.full_name,
    email: request.email,
    role: "resident",
    unit_id: unitId || request.unit_id || null,
  });
  if (userInsertError) throw new Error(userInsertError.message);

  const { error: updateError } = await supabase
    .from("resident_signup_requests")
    .update({ status: "approved", reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", request.id);
  if (updateError) throw new Error(updateError.message);
}

export async function rejectSignupRequest(requestId: string): Promise<void> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("resident_signup_requests")
    .update({ status: "rejected", reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
}
