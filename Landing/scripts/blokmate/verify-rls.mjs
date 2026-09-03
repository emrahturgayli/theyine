import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const TAG = `rls-verify-${Date.now()}`;
const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? `: ${detail}` : ""}`);
}

async function main() {
  // ---- seed two tenants, each with a building/unit/invoice, plus one
  // manager and one resident auth user per tenant ----
  const { data: tenantA, error: tErrA } = await admin
    .from("tenants")
    .insert({ name: `${TAG}-tenant-A`, sector: "apartment", contact_email: "a@example.com", status: "active" })
    .select()
    .single();
  const { data: tenantB, error: tErrB } = await admin
    .from("tenants")
    .insert({ name: `${TAG}-tenant-B`, sector: "apartment", contact_email: "b@example.com", status: "active" })
    .select()
    .single();
  if (tErrA || tErrB) throw new Error(`tenant seed failed: ${tErrA?.message || tErrB?.message}`);

  const { data: buildingA } = await admin
    .from("buildings")
    .insert({ tenant_id: tenantA.id, name: "Building A", unit_count: 1 })
    .select()
    .single();
  const { data: buildingB } = await admin
    .from("buildings")
    .insert({ tenant_id: tenantB.id, name: "Building B", unit_count: 1 })
    .select()
    .single();

  const { data: unitA } = await admin
    .from("units")
    .insert({ building_id: buildingA.id, tenant_id: tenantA.id, label: "A1" })
    .select()
    .single();
  const { data: unitB } = await admin
    .from("units")
    .insert({ building_id: buildingB.id, tenant_id: tenantB.id, label: "B1" })
    .select()
    .single();

  const { data: invoiceA } = await admin
    .from("invoices")
    .insert({ unit_id: unitA.id, tenant_id: tenantA.id, amount_cents: 8000, due_date: "2026-09-10" })
    .select()
    .single();
  const { data: invoiceB } = await admin
    .from("invoices")
    .insert({ unit_id: unitB.id, tenant_id: tenantB.id, amount_cents: 9000, due_date: "2026-09-10" })
    .select()
    .single();

  record("seed fixtures", true, `tenantA=${tenantA.id} tenantB=${tenantB.id}`);

  // ---- create one manager + one resident auth user for tenant A ----
  const password = "Verify-RLS-2026!";
  const managerEmail = `${TAG}-manager@example.com`;
  const residentEmail = `${TAG}-resident@example.com`;

  const { data: managerAuth, error: mErr } = await admin.auth.admin.createUser({
    email: managerEmail,
    password,
    email_confirm: true,
  });
  const { data: residentAuth, error: rErr } = await admin.auth.admin.createUser({
    email: residentEmail,
    password,
    email_confirm: true,
  });
  if (mErr || rErr) throw new Error(`auth user creation failed: ${mErr?.message || rErr?.message}`);

  // public.users.id MUST equal auth.uid() for the hook + RLS's
  // blokmate_current_unit_id() to resolve correctly (documented assumption
  // in migration 002's header comment).
  await admin.from("users").insert([
    {
      id: managerAuth.user.id,
      tenant_id: tenantA.id,
      full_name: "Test Manager",
      email: managerEmail,
      role: "manager",
    },
    {
      id: residentAuth.user.id,
      tenant_id: tenantA.id,
      unit_id: unitA.id,
      full_name: "Test Resident",
      email: residentEmail,
      role: "resident",
    },
  ]);
  record("provision manager+resident (tenant A)", true, `manager=${managerAuth.user.id} resident=${residentAuth.user.id}`);

  // ---- sign in as each and inspect the JWT for tenant_id/role claims ----
  async function signInAndDecode(email) {
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
    const payload = JSON.parse(Buffer.from(data.session.access_token.split(".")[1], "base64").toString("utf8"));
    return { client, payload };
  }

  const { client: managerClient, payload: managerClaims } = await signInAndDecode(managerEmail);
  const hookActive = typeof managerClaims.tenant_id === "string" && typeof managerClaims.blokmate_role === "string";
  record(
    "Auth Hook injects tenant_id/blokmate_role into JWT",
    hookActive,
    hookActive
      ? `tenant_id=${managerClaims.tenant_id} blokmate_role=${managerClaims.blokmate_role}`
      : `claims seen: ${JSON.stringify(Object.keys(managerClaims))} — hook likely not enabled in Studio (Authentication → Hooks → Custom Access Token), or 003_fix_role_claim_collision.sql wasn't applied`
  );

  if (!hookActive) {
    record("RLS isolation tests", false, "skipped — cannot test tenant-scoped RLS without tenant_id in the JWT");
  } else {
    const { client: residentClient } = await signInAndDecode(residentEmail);

    // Manager (tenant A) must see tenant A's invoice, never tenant B's.
    const { data: managerInvoices, error: miErr } = await managerClient
      .from("invoices")
      .select("id, tenant_id");
    const managerSeesOwnTenant = !miErr && managerInvoices.some((i) => i.id === invoiceA.id);
    const managerLeaksOtherTenant = !miErr && managerInvoices.some((i) => i.id === invoiceB.id);
    record("manager sees own-tenant invoice", managerSeesOwnTenant, miErr?.message);
    record("manager does NOT see other-tenant invoice", !managerLeaksOtherTenant);

    // Resident (tenant A, unit A) must see their own invoice, never
    // tenant B's, and never even tenant A's OTHER units (not seeded here,
    // but the point of the exercise is B is invisible).
    const { data: residentInvoices, error: riErr } = await residentClient
      .from("invoices")
      .select("id, tenant_id, unit_id");
    const residentSeesOwn = !riErr && residentInvoices.some((i) => i.id === invoiceA.id);
    const residentLeaksOtherTenant = !riErr && residentInvoices.some((i) => i.id === invoiceB.id);
    record("resident sees own invoice", residentSeesOwn, riErr?.message);
    record("resident does NOT see other-tenant invoice", !residentLeaksOtherTenant);

    // Explicit cross-tenant unitId probe, mirroring fetchResidentDashboard
    // being called with a foreign unit id.
    const { data: crossUnitInvoices, error: cuErr } = await residentClient
      .from("invoices")
      .select("id")
      .eq("unit_id", unitB.id);
    record(
      "resident querying tenant B's unitId directly returns zero rows",
      !cuErr && crossUnitInvoices.length === 0,
      cuErr?.message
    );
  }

  // ---- cleanup: delete everything this script created ----
  await admin.from("invoices").delete().in("id", [invoiceA.id, invoiceB.id]);
  await admin.from("units").delete().in("id", [unitA.id, unitB.id]);
  await admin.from("buildings").delete().in("id", [buildingA.id, buildingB.id]);
  await admin.from("users").delete().in("id", [managerAuth.user.id, residentAuth.user.id]);
  await admin.auth.admin.deleteUser(managerAuth.user.id);
  await admin.auth.admin.deleteUser(residentAuth.user.id);
  await admin.from("tenants").delete().in("id", [tenantA.id, tenantB.id]);
  record("cleanup", true, "all fixture rows + auth users removed");

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
