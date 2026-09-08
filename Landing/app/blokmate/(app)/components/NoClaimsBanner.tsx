"use client";

import { useEffect, useState } from "react";
import { getOwnSignupRequest, type ResidentSignupRequest } from "@/lib/blokmate-invites";

/**
 * Shown in the (app) layout whenever the session has no tenant_id/role
 * claim yet (see BlokmateAppLayout). Distinguishes the common onboarding
 * case — a resident whose signup request is still pending manager
 * approval — from the generic "Auth Hook not configured" case, which is
 * an actual misconfiguration a developer needs to fix.
 */
export default function NoClaimsBanner() {
  const [request, setRequest] = useState<ResidentSignupRequest | null | undefined>(undefined);

  useEffect(() => {
    getOwnSignupRequest()
      .then(setRequest)
      .catch(() => setRequest(null));
  }, []);

  if (request === undefined) return null;

  if (request?.status === "pending") {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 md:px-6 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
        Kayıt talebin yönetici onayını bekliyor — onaylandıktan sonra listeler dolacak. Onaylandıktan sonra hâlâ boş görünüyorsa çıkış yapıp tekrar giriş dene.
      </div>
    );
  }

  if (request?.status === "rejected") {
    return (
      <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 md:px-6 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        Kayıt talebin yönetici tarafından reddedildi. Sorularınız için bina yöneticinizle iletişime geçin.
      </div>
    );
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 md:px-6 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      Oturumunda henüz tenant_id/rol bilgisi yok — Supabase Auth Hook (Custom
      Access Token) etkin değil ya da hesabın public.users tablosunda henüz
      oluşturulmadı. Listeler bu durumda boş görünür.
    </div>
  );
}
