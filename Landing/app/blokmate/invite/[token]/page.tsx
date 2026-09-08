"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBlokmateSupabaseBrowser } from "@/lib/blokmate-supabase-browser";
import { getPublicInviteByToken, submitResidentSignupRequest, type PublicInvite } from "@/lib/blokmate-invites";
import PasswordInput from "@/components/PasswordInput";

/**
 * Public invite-acceptance page — no auth required to view it. The
 * invitee never sees a list of sites/buildings/units or types one in;
 * everything comes from the token (see invite_tokens_select_public RLS,
 * migration 014). Submitting creates their auth account + a
 * resident_signup_requests row (pending manager approval), same
 * end state as the dropdown path on /blokmate/register.
 */
export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const [invite, setInvite] = useState<PublicInvite | null | undefined>(undefined);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicInviteByToken(params.token)
      .then(setInvite)
      .catch(() => setInvite(null));
  }, [params.token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setStatus("loading");
    setError(null);

    const supabase = getBlokmateSupabaseBrowser();
    if (!supabase) {
      setStatus("error");
      setError("Supabase yapılandırılmamış.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.session || !signUpData.user) {
      setStatus("error");
      setError(signUpError?.message ?? "Kayıt oluşturulamadı — e-posta onayı gerekiyor olabilir.");
      return;
    }

    try {
      await submitResidentSignupRequest({
        user_id: signUpData.user.id,
        tenant_id: invite.tenant_id,
        building_id: invite.building_id,
        unit_id: invite.unit_id ?? undefined,
        invite_token_id: invite.id,
        full_name: fullName,
        phone: phone || undefined,
        email,
      });
      setStatus("pending");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Kayıt talebi gönderilemedi.");
    }
  }

  if (invite === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16 text-sm text-ink-faint">
        Yükleniyor…
      </main>
    );
  }

  if (invite === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-ink">Davet linki geçersiz</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Bu link süresi dolmuş, iptal edilmiş ya da hiç var olmamış olabilir. Bina yöneticinizden yeni bir davet isteyin.
          </p>
          <Link href="/blokmate/register" className="btn mt-6 inline-flex bg-blue-600 text-white hover:bg-blue-700">
            Manuel kayıt ol
          </Link>
        </div>
      </main>
    );
  }

  if (status === "pending") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-ink">Kayıt talebin alındı</h1>
          <p className="mt-3 text-sm text-ink-soft">
            {invite.tenantName} — {invite.buildingName} yöneticisi talebini onayladıktan sonra panele erişebileceksin.
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
        <h1 className="text-2xl font-bold text-ink">Davete katıl</h1>
        <div className="mt-3 rounded-lg bg-mist px-4 py-3 text-sm">
          <p className="font-semibold text-ink">{invite.tenantName}</p>
          <p className="text-ink-soft">
            {invite.buildingName}
            {invite.unitLabel ? ` — Daire ${invite.unitLabel}` : ""}
          </p>
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
            {status === "loading" ? "Gönderiliyor…" : "Kayıt talebi gönder"}
          </button>
        </form>
      </div>
    </main>
  );
}
