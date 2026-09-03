import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBlokmateSupabase } from "@/lib/blokmate";

/**
 * Completes BlokMate account provisioning after a client-side
 * supabase.auth.signUp() call. Two-step by necessity, not by choice:
 * public.users has an RLS insert policy requiring role = 'manager'
 * (migration 002) — a brand-new auth user has no `public.users` row yet,
 * so they have no role/tenant_id claim to satisfy that policy with. This
 * route uses the service_role key (bypasses RLS) to do the one insert
 * that couldn't happen client-side, after verifying the caller really is
 * the user they claim to be.
 *
 * Manager path: creates a brand-new tenant + building, then the manager's
 * public.users row.
 * Resident path: joins an EXISTING tenant via `tenantCode` — for this MVP
 * that's just the tenant's raw UUID (shown to a manager after they
 * register, meant to be shared with residents out-of-band). Not a real
 * invite-link/expiry system; fine for now, flagged so it isn't mistaken
 * for one.
 *
 * The new user's JWT was minted at signUp time, before this insert
 * existed — it has no tenant_id/blokmate_role yet. The client MUST call
 * supabase.auth.refreshSession() after this route returns 200 to get a
 * token the Custom Access Token hook has re-run for (see
 * app/blokmate/register/page.tsx).
 */
export async function POST(request: Request) {
  let body: {
    accessToken?: string;
    role?: "manager" | "resident";
    fullName?: string;
    buildingName?: string;
    tenantCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { accessToken, role, fullName, buildingName, tenantCode } = body;
  if (!accessToken || typeof accessToken !== "string") {
    return NextResponse.json({ error: "missing_access_token" }, { status: 401 });
  }
  if (role !== "manager" && role !== "resident") {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "invalid_full_name" }, { status: 400 });
  }
  if (role === "manager" && (!buildingName || !buildingName.trim())) {
    return NextResponse.json({ error: "invalid_building_name" }, { status: 400 });
  }
  if (role === "resident" && (!tenantCode || !tenantCode.trim())) {
    return NextResponse.json({ error: "invalid_tenant_code" }, { status: 400 });
  }

  // Verify the token actually belongs to a real, current Supabase session
  // — never trust a client-supplied user id directly.
  const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonUrl || !anonKey) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const tokenClient = createClient(anonUrl, anonKey);
  const { data: userData, error: userError } = await tokenClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }
  const authUser = userData.user;

  const supabase = getBlokmateSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  // Already provisioned? Don't silently overwrite an existing row/tenant.
  const { data: existing } = await supabase.from("users").select("id").eq("id", authUser.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "already_registered" }, { status: 409 });
  }

  if (role === "manager") {
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: buildingName!.trim(),
        sector: "apartment",
        contact_email: authUser.email ?? "",
        status: "trial",
      })
      .select()
      .single();
    if (tenantError || !tenant) {
      console.error("[blokmate-register] tenant insert failed:", tenantError?.message);
      return NextResponse.json({ error: "tenant_create_failed" }, { status: 500 });
    }

    const { error: buildingError } = await supabase.from("buildings").insert({
      tenant_id: tenant.id,
      name: buildingName!.trim(),
    });
    if (buildingError) {
      console.error("[blokmate-register] building insert failed:", buildingError.message);
      // Non-fatal: the tenant exists, the manager can add buildings from
      // the dashboard. Don't fail registration over it.
    }

    const { error: userInsertError } = await supabase.from("users").insert({
      id: authUser.id,
      tenant_id: tenant.id,
      full_name: fullName.trim(),
      email: authUser.email ?? "",
      role: "manager",
    });
    if (userInsertError) {
      console.error("[blokmate-register] manager users insert failed:", userInsertError.message);
      return NextResponse.json({ error: "user_create_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tenantId: tenant.id, role: "manager" });
  }

  // resident path
  const { data: tenant, error: tenantLookupError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantCode!.trim())
    .maybeSingle();
  if (tenantLookupError) {
    console.error("[blokmate-register] tenant lookup failed:", tenantLookupError.message);
    return NextResponse.json({ error: "tenant_lookup_failed" }, { status: 500 });
  }
  if (!tenant) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const { error: residentInsertError } = await supabase.from("users").insert({
    id: authUser.id,
    tenant_id: tenant.id,
    full_name: fullName.trim(),
    email: authUser.email ?? "",
    role: "resident",
    // unit_id intentionally left null — assigning a resident to a specific
    // unit is a manager action from the dashboard, not part of self-serve
    // signup. Their invoices/units queries will return nothing until then.
  });
  if (residentInsertError) {
    console.error("[blokmate-register] resident users insert failed:", residentInsertError.message);
    return NextResponse.json({ error: "user_create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tenantId: tenant.id, role: "resident" });
}
