"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBlokmateSupabaseBrowser } from "@/lib/blokmate-supabase-browser";
import { listPublicTenants, listPublicBuildings, listPublicUnits, submitResidentSignupRequest } from "@/lib/blokmate-invites";
import PasswordInput from "@/components/PasswordInput";

type Role = "manager" | "resident";

/**
 * Self-serve signup, two paths — both create ONLY an identity now, never
 * a building:
 *  - manager: creates a tenant (their own workspace/portfolio — an
 *    internal placeholder name, never asked for) + their `users` row.
 *    Adding buildings/sites is a separate, repeatable post-login step
 *    (see app/blokmate/(app)/buildings/page.tsx and the "no buildings
 *    yet" prompt on the dashboard) — a manager who runs 20 sites was
 *    previously forced to name one of them right here at signup, which
 *    made no sense; now they can add 1, 5, 20, however many, from the
 *    dashboard after logging in.
 *  - resident: picks their Site -> Building -> Unit from cascading
 *    dropdowns (never types a tenant id/name) and lands in
 *    resident_signup_requests, pending manager approval — NOT
 *    provisioned into `users` directly. A resident with an invite link
 *    should use that link instead (/blokmate/invite/[token]) — it skips
 *    the dropdowns entirely and is the recommended path; this page is
 *    the fallback for a resident who doesn't have one.
 */
export default function BlokmateRegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("manager");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; label: string }[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [unitId, setUnitId] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (role !== "resident") return;
    listPublicTenants()
      .then(setTenants)
      .catch(() => setTenants([]));
  }, [role]);

  useEffect(() => {
    setBuildingId("");
    setBuildings([]);
    if (!tenantId) return;
    listPublicBuildings(tenantId)
      .then(setBuildings)
      .catch(() => setBuildings([]));
  }, [tenantId]);

  useEffect(() => {
    setUnitId("");
    setUnits([]);
    if (!buildingId) return;
    listPublicUnits(buildingId)
      .then(setUnits)
      .catch(() => setUnits([]));
  }, [buildingId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = getBlokmateSupabaseBrowser();
    if (!supabase) {
      setStatus("error");
      setError("Supabase yapılandırılmamış. Lütfen yöneticiye bildir.");
      setErrorCount((c) => c + 1);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.session || !signUpData.user) {
      setStatus("error");
      setError(signUpError?.message ?? "Kayıt oluşturulamadı — e-posta onayı gerekiyor olabilir.");
      setErrorCount((c) => c + 1);
      return;
    }

    if (role === "manager") {
      const res = await fetch("/api/blokmate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: signUpData.session.access_token,
          role,
          fullName,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(body.error ?? "Kayıt tamamlanamadı.");
        setErrorCount((c) => c + 1);
        return;
      }
      // The JWT minted at signUp had no tenant_id/blokmate_role yet — the
      // Auth Hook only had something to read after the insert above.
      await supabase.auth.refreshSession();
      router.push("/blokmate/dashboard");
      return;
    }

    // resident path — lands in resident_signup_requests, not `users`.
    try {
      await submitResidentSignupRequest({
        user_id: signUpData.user.id,
        tenant_id: tenantId,
        building_id: buildingId,
        unit_id: unitId || undefined,
        full_name: fullName,
        phone: phone || undefined,
        email,
      });
      setStatus("pending");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Kayıt talebi gönderilemedi.");
      setErrorCount((c) => c + 1);
    }
  }

  if (status === "pending") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-ink">Kayıt talebin alındı</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Bina yöneticisi talebini onayladıktan sonra panele erişebileceksin. Onaylandıktan sonra giriş yapıp tekrar dene.
          </p>
          <Link href="/blokmate/login" className="btn mt-6 inline-flex bg-blue-600 text-white hover:bg-blue-700">
            Giriş sayfasına dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <Link href="/blokmate" className="text-sm font-semibold text-blue-600">
          ← BlokMate
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-ink">Hesap oluştur</h1>

        <div className="mt-5 flex rounded-lg border border-line p-1">
          <button
            type="button"
            onClick={() => setRole("manager")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              role === "manager" ? "bg-blue-600 text-white" : "text-ink-faint"
            }`}
          >
            Bina Yöneticisi
          </button>
          <button
            type="button"
            onClick={() => setRole("resident")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              role === "resident" ? "bg-blue-600 text-white" : "text-ink-faint"
            }`}
          >
            Sakin
          </button>
        </div>

        {role === "resident" && (
          <p className="mt-3 text-xs text-ink-faint">
            Yöneticinizden bir davet linki aldıysanız onu kullanmanız daha hızlıdır — bu form, davet linki olmayanlar içindir.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-ink">
              Ad Soyad
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
          {role === "resident" && (
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-ink">
                Telefon
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Şifre
            </label>
            <PasswordInput
              id="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              autoComplete="new-password"
            />
          </div>

          {role === "manager" ? (
            <p className="text-xs text-ink-faint">
              Hesabını oluşturduktan sonra panelden istediğin kadar site/bina ekleyebilirsin.
            </p>
          ) : (
            <>
              <div>
                <label htmlFor="tenantId" className="text-sm font-medium text-ink">
                  Site
                </label>
                <select
                  id="tenantId"
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
                >
                  <option value="" disabled>
                    Site seç…
                  </option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="buildingId" className="text-sm font-medium text-ink">
                  Bina
                </label>
                <select
                  id="buildingId"
                  required
                  disabled={!tenantId}
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="" disabled>
                    {tenantId ? "Bina seç…" : "Önce site seç"}
                  </option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="unitId" className="text-sm font-medium text-ink">
                  Daire
                </label>
                <select
                  id="unitId"
                  disabled={!buildingId}
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="">{buildingId ? "Daire seç (opsiyonel)" : "Önce bina seç"}</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {status === "error" && (
            <div role="alert">
              <p className="text-sm text-red-600">{error}</p>
              {errorCount >= 2 && (
                <p className="mt-1 text-xs text-ink-faint">
                  Eğer bu hata devam ederse lütfen{" "}
                  <a href="mailto:destek@theyine.com" className="font-semibold text-blue-600">
                    destek@theyine.com
                  </a>{" "}
                  ile iletişime geçin.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || (role === "resident" && (!tenantId || !buildingId))}
            className="btn w-full min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {status === "loading" ? "Oluşturuluyor…" : role === "resident" ? "Kayıt talebi gönder" : "Hesap oluştur"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          Zaten hesabın var mı?{" "}
          <Link href="/blokmate/login" className="font-semibold text-blue-600">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
