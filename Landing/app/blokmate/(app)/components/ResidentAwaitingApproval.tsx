"use client";

import { useRouter } from "next/navigation";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import type { ResidentSignupRequest } from "@/lib/blokmate-invites";

/**
 * Full-panel takeover shown instead of the dashboard when the signed-in
 * user has no tenant_id/role claim yet AND has a resident_signup_request
 * on file — i.e. they signed up (invite code, link, or dropdown) but a
 * manager hasn't approved them. Distinct from NoClaimsBanner (a thin
 * strip shown on every (app) page for the same "no claims" condition) —
 * this is the dashboard's own, more explicit rendering of it, and skips
 * the pointless RLS-blocked metric fetch entirely rather than loading a
 * dashboard full of zeros underneath a banner.
 */
export default function ResidentAwaitingApproval({ request }: { request: ResidentSignupRequest }) {
  const router = useRouter();
  const { signOut } = useBlokmateAuth();

  const rejected = request.status === "rejected";

  async function handleSignOut() {
    await signOut();
    router.push("/blokmate/login");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card w-full max-w-md p-8 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            rejected
              ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${rejected ? "bg-red-500" : "animate-pulse bg-amber-500"}`} />
          {rejected ? "Reddedildi" : "Onay bekleniyor"}
        </span>

        <span
          className={`mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full ${
            rejected ? "bg-red-50 text-red-600 dark:bg-red-950/50" : "bg-amber-50 text-amber-600 dark:bg-amber-950/50"
          }`}
        >
          {rejected ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          )}
        </span>

        <h1 className="mt-4 text-xl font-bold text-ink">
          {rejected ? "Kayıt talebin reddedildi" : "Yönetici onayını bekliyorsun"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          {rejected
            ? "Bina yöneticiniz kayıt talebinizi reddetti. Sorularınız için doğrudan yöneticinizle iletişime geçin."
            : "Kayıt talebin bina yöneticisine iletildi. Onaylandığında bu ekranın yerini panelin alacak."}
        </p>

        {!rejected && (
          <ol className="mx-auto mt-6 flex max-w-xs flex-col gap-3 text-left">
            <li className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="text-ink-soft">Kayıt talebin oluşturuldu</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-amber-500" />
              <span className="font-medium text-ink">Yönetici onayı bekleniyor</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line" />
              <span className="text-ink-faint">Panele erişim</span>
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-7 min-h-[40px] rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft hover:border-blue-500 hover:text-blue-600"
        >
          Çıkış yap
        </button>
      </div>
    </div>
  );
}
