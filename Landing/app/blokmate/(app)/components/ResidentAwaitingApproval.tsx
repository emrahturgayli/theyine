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
      <div className="card flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            rejected ? "bg-red-50 text-red-600 dark:bg-red-950/50" : "bg-amber-50 text-amber-600 dark:bg-amber-950/50"
          }`}
        >
          {rejected ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          )}
        </span>
        <h2 className="text-lg font-bold text-ink">
          {rejected ? "Kayıt talebin reddedildi" : "Yönetici davetini bekliyorsunuz"}
        </h2>
        <p className="max-w-sm text-sm text-ink-soft">
          {rejected
            ? "Bina yöneticiniz kayıt talebinizi reddetti. Sorularınız için yöneticinizle iletişime geçin."
            : "Kayıt talebin bina yöneticisine iletildi. Yönetici onayladıktan sonra panele erişebileceksin — onaylandıktan sonra çıkış yapıp tekrar giriş yapman gerekebilir."}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 min-h-[40px] rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft hover:border-blue-500 hover:text-blue-600"
        >
          Çıkış yap
        </button>
      </div>
    </div>
  );
}
