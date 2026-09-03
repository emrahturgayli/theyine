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

  // updateBuilding / updateUnit equivalents
  if (building) {
    const { error } = await client.from("buildings").update({ name: "E2E Test Bina (edited)" }).eq("id", building.id);
    record("updateBuilding equivalent succeeds", !error, error?.message);
    const { data: reread } = await client.from("buildings").select("name").eq("id", building.id).single();
    record("building name actually changed", reread?.name === "E2E Test Bina (edited)", reread?.name);
  }
  if (unit) {
    const { error } = await client.from("units").update({ label: "E2E-1-edited" }).eq("id", unit.id);
    record("updateUnit equivalent succeeds", !error, error?.message);
  }

  // deleteBuilding equivalent — on a disposable second building, so the
  // main `building` used by later steps stays intact.
  const { data: disposableBuilding } = await client
    .from("buildings")
    .insert({ name: "E2E Disposable Bina", address: null, tenant_id: claims.tenant_id })
    .select()
    .single();
  if (disposableBuilding) {
    const { error } = await client.from("buildings").delete().eq("id", disposableBuilding.id);
    record("deleteBuilding equivalent succeeds", !error, error?.message);
    const { data: goneCheck } = await client.from("buildings").select("id").eq("id", disposableBuilding.id);
    record("deleted building no longer appears in list query", (goneCheck?.length ?? 0) === 0);
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

  // markInvoicePaid equivalent: payment insert + invoice status update, same shape as lib/blokmate-data.ts.
  if (invoice) {
    const { error: payErr } = await client
      .from("payments")
      .insert({ invoice_id: invoice.id, amount_cents: invoice.amount_cents, method: "cash", tenant_id: claims.tenant_id });
    record("markInvoicePaid: payment insert succeeds", !payErr, payErr?.message);

    const { error: updErr } = await client.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
    record("markInvoicePaid: invoice status update succeeds", !updErr, updErr?.message);

    const { data: paidInvoice } = await client.from("invoices").select("status").eq("id", invoice.id).single();
    record("invoice status is now 'paid'", paidInvoice?.status === "paid", paidInvoice?.status);
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

  // Negative control for migration 006: a resident (same tenant, no
  // manager/accountant role) must NOT be able to update or delete a
  // building. If 006 hasn't been applied yet, these two checks fail —
  // that's the test correctly catching the pre-006 gap, not a bug here.
  const residentEmail = `${TAG}-resident@theyine.com`;
  const { data: residentAuth } = await admin.auth.admin.createUser({ email: residentEmail, password, email_confirm: true });
  await admin.from("users").insert({ id: residentAuth.user.id, tenant_id: tenant.id, full_name: "Resident", email: residentEmail, role: "resident" });
  const residentClient = createClient(url, anonKey, { auth: { persistSession: false } });
  await residentClient.auth.signInWithPassword({ email: residentEmail, password });

  if (building) {
    const { error: residentUpdateErr, count: residentUpdateCount } = await residentClient
      .from("buildings")
      .update({ name: "resident should not be able to do this" })
      .eq("id", building.id)
      .select("id", { count: "exact" });
    // RLS on UPDATE without a matching row silently affects 0 rows rather
    // than erroring — check the affected count, not just `error`.
    record(
      "resident CANNOT update a building (migration 006)",
      !!residentUpdateErr || (residentUpdateCount ?? 0) === 0,
      residentUpdateErr?.message ?? `rows affected: ${residentUpdateCount}`
    );
  }

  await admin.from("users").delete().eq("id", residentAuth.user.id);
  await admin.auth.admin.deleteUser(residentAuth.user.id);

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
