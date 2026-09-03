import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? `: ${detail}` : ""}`);
}

function decodeClaims(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
}

async function main() {
  const TAG = `create-verify-${Date.now()}`;
  const email = `${TAG}@theyine.com`;
  const password = "CreateVerify-2026!";

  const { data: authUser } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const { data: tenant } = await admin
    .from("tenants")
    .insert({ name: `${TAG}-tenant`, sector: "apartment", contact_email: email, status: "active" })
    .select()
    .single();
  await admin.from("users").insert({ id: authUser.user.id, tenant_id: tenant.id, full_name: "Create Verify", email, role: "manager" });

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: signIn } = await client.auth.signInWithPassword({ email, password });
  const claims = decodeClaims(signIn.session.access_token);
  record("manager session has tenant_id claim", !!claims.tenant_id, claims.tenant_id);

  // Mirrors lib/blokmate-data.ts's createBuilding: tenant_id sourced from claims, included in insert.
  const { data: building, error: bErr } = await client
    .from("buildings")
    .insert({ name: "E2E Test Bina", address: null, tenant_id: claims.tenant_id })
    .select()
    .single();
  record("createBuilding equivalent insert succeeds", !bErr && !!building, bErr?.message);

  let unit = null;
  if (building) {
    const { data, error } = await client
      .from("units")
      .insert({ building_id: building.id, label: "E2E-1", owner_name: null, tenant_id: claims.tenant_id })
      .select()
      .single();
    unit = data;
    record("createUnit equivalent insert succeeds", !error && !!unit, error?.message);
  }

  let invoice = null;
  if (unit) {
    const { data, error } = await client
      .from("invoices")
      .insert({ unit_id: unit.id, amount_cents: 5000, due_date: "2026-10-01", description: null, tenant_id: claims.tenant_id })
      .select()
      .single();
    invoice = data;
    record("createInvoice equivalent insert succeeds", !error && !!invoice, error?.message);
  }

  if (building) {
    const { error } = await client
      .from("announcements")
      .insert({ building_id: building.id, title: "E2E Duyuru", body: "test", tenant_id: claims.tenant_id });
    record("createAnnouncement equivalent insert succeeds", !error, error?.message);

    const { error: tErr } = await client
      .from("tickets")
      .insert({ building_id: building.id, unit_id: unit?.id ?? null, subject: "E2E Talep", body: "test", tenant_id: claims.tenant_id });
    record("createTicket equivalent insert succeeds", !tErr, tErr?.message);
  }

  // Confirm each row is actually visible via a subsequent SELECT under
  // the same session — i.e. "appears in the list" per the request.
  const { data: buildingsAfter } = await client.from("buildings").select("id").eq("id", building?.id ?? "");
  record("created building appears in list query", (buildingsAfter?.length ?? 0) === 1);
  const { data: unitsAfter } = await client.from("units").select("id").eq("id", unit?.id ?? "");
  record("created unit appears in list query", (unitsAfter?.length ?? 0) === (unit ? 1 : 0));
  const { data: invoicesAfter } = await client.from("invoices").select("id").eq("id", invoice?.id ?? "");
  record("created invoice appears in list query", (invoicesAfter?.length ?? 0) === (invoice ? 1 : 0));

  // Negative control: confirm the OLD (no tenant_id) insert shape still fails,
  // proving tenant_id was really the missing piece, not something else.
  const { error: oldShapeErr } = await client.from("buildings").insert({ name: "should fail", address: null });
  record("insert WITHOUT tenant_id still fails (confirms root cause)", !!oldShapeErr, oldShapeErr?.message);

  // Cleanup
  await admin.from("tickets").delete().eq("building_id", building?.id ?? "");
  await admin.from("announcements").delete().eq("building_id", building?.id ?? "");
  if (invoice) await admin.from("invoices").delete().eq("id", invoice.id);
  if (unit) await admin.from("units").delete().eq("id", unit.id);
  if (building) await admin.from("buildings").delete().eq("id", building.id);
  await admin.from("users").delete().eq("id", authUser.user.id);
  await admin.auth.admin.deleteUser(authUser.user.id);
  await admin.from("tenants").delete().eq("id", tenant.id);
  record("cleanup", true);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
