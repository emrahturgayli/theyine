"use client";

import { getBlokmateSupabaseBrowser, getBlokmateSessionClaims } from "@/lib/blokmate-supabase-browser";

/**
 * One-shot sample-data generator for a brand new manager's tenant — lets
 * them click around a populated dashboard instead of staring at empty
 * lists on day one. Every insert carries the caller's own tenant_id (read
 * off their JWT, same pattern as lib/blokmate-data.ts's requireTenantId)
 * and goes through the RLS-enforced anon-key client, so this can never
 * touch another tenant's rows — Postgres would reject the insert's
 * `with check` before this function's own logic even matters.
 *
 * Deliberately not using the blokmate-data.ts create* helpers: those
 * return void, and seeding needs each inserted row's id back to link the
 * next table (unit -> building, invoice -> unit, etc.), so this talks to
 * Supabase directly like lib/blokmate-payments.ts does.
 */
export async function seedDemoData(): Promise<void> {
  const supabase = getBlokmateSupabaseBrowser();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");
  const claims = await getBlokmateSessionClaims();
  if (!claims) throw new Error("Tenant bilgisi bulunamadı — lütfen tekrar giriş yapın.");
  const tenant_id = claims.tenant_id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .insert({ tenant_id, name: "Demo Apt. 1", address: "Örnek Mah. Demo Sok. No:1", unit_count: 3 })
    .select("id")
    .single();
  if (buildingError) throw new Error(buildingError.message);
  const buildingId = building.id as string;

  const unitLabels = ["1A", "1B", "2A"];
  const { data: units, error: unitsError } = await supabase
    .from("units")
    .insert(unitLabels.map((label) => ({ tenant_id, building_id: buildingId, label, owner_name: `Sakin ${label}` })))
    .select("id");
  if (unitsError) throw new Error(unitsError.message);

  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 5).toISOString().slice(0, 10);

  const { error: invoicesError } = await supabase.from("invoices").insert(
    (units ?? []).map((u: { id: string }) => ({
      tenant_id,
      unit_id: u.id,
      amount_cents: 15000,
      due_date: dueDate,
      status: "unpaid" as const,
      description: "Aylık aidat (demo)",
    }))
  );
  if (invoicesError) throw new Error(invoicesError.message);

  const { data: announcement, error: announcementError } = await supabase
    .from("announcements")
    .insert({
      tenant_id,
      building_id: buildingId,
      author_user_id: user?.id ?? null,
      title: "Hoş geldiniz!",
      body: "Bu, BlokMate'i denemeniz için oluşturulmuş örnek bir duyurudur.",
    })
    .select("id")
    .single();
  if (announcementError) throw new Error(announcementError.message);

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      tenant_id,
      building_id: buildingId,
      unit_id: units?.[0]?.id ?? null,
      reported_by_user_id: user?.id ?? null,
      subject: "Asansör bakımı (demo talep)",
      body: "Örnek bir bakım talebi.",
      status: "open" as const,
    })
    .select("id")
    .single();
  if (ticketError) throw new Error(ticketError.message);

  if (user?.id) {
    await supabase.from("comments").insert({
      tenant_id,
      building_id: buildingId,
      announcement_id: announcement.id,
      user_id: user.id,
      message: "Bu bir örnek yorumdur.",
    });
    await supabase.from("comments").insert({
      tenant_id,
      building_id: buildingId,
      ticket_id: ticket.id,
      user_id: user.id,
      message: "Teknisyen yarın gelecek.",
    });
  }
}
