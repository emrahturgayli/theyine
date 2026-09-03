"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBlokmateSupabaseBrowser } from "@/lib/blokmate-supabase-browser";

type Role = "manager" | "resident";

/**
 * Self-serve signup, two paths (see app/api/blokmate/register/route.ts
 * for why this is a two-step client-signup + server-provision flow, not
 * a single insert):
 *  - manager: creates a brand-new tenant + building.
 *  - resident: joins an existing tenant via its raw UUID ("kurum kodu")
 *    — an MVP stand-in for a real invite-link system, not one itself.
 */
export default function BlokmateRegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("manager");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = getBlokmateSupabaseBrowser();
    if (!supabase) {
      setStatus("error");
      setError("Supabase yapılandırılmamış.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.session) {
      setStatus("error");
      setError(signUpError?.message ?? "Kayıt oluşturulamadı — e-posta onayı gerekiyor olabilir.");
      return;
    }

    const res = await fetch("/api/blokmate/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: signUpData.session.access_token,
        role,
        fullName,
        buildingName: role === "manager" ? buildingName : undefined,
        tenantCode: role === "resident" ? tenantCode : undefined,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      setStatus("error");
      setError(body.error ?? "Kayıt tamamlanamadı.");
      return;
    }

    // The JWT minted at signUp had no tenant_id/blokmate_role yet — the
    // Auth Hook only had something to read after the insert above.
    // Refresh to get a token it re-runs for.
    await supabase.auth.refreshSession();
    router.push("/blokmate/dashboard");
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
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>

          {role === "manager" ? (
            <div>
              <label htmlFor="buildingName" className="text-sm font-medium text-ink">
                Bina / Site adı
              </label>
              <input
                id="buildingName"
                required
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="tenantCode" className="text-sm font-medium text-ink">
                Kurum kodu
              </label>
              <input
                id="tenantCode"
                required
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                placeholder="Yöneticinizden alın"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
          )}

          {status === "error" && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn w-full min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {status === "loading" ? "Oluşturuluyor…" : "Hesap oluştur"}
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
