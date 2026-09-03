"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { BlokmateToastProvider } from "@/lib/blokmate-toast";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

/**
 * Shared shell for every authenticated BlokMate page (dashboard,
 * buildings, units, invoices, payments, announcements, tickets) — a route
 * group ("(app)") so these share one layout without adding a URL segment
 * (this renders at /blokmate/dashboard, not /blokmate/app/dashboard).
 *
 * Auth guard is client-side only: there's no server-side session check
 * (middleware/cookies) in this codebase yet, so a signed-out visitor
 * briefly sees this layout mount before the redirect fires. That's a UX
 * flash, not a data leak — every actual query in these pages goes through
 * the anon-key client, so RLS (not this guard) is what stops a signed-out
 * or wrong-tenant request from ever seeing another tenant's rows.
 */
export default function BlokmateAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, claims, loading } = useBlokmateAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/blokmate/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-faint">
        Yükleniyor…
      </div>
    );
  }

  if (!session) {
    // Redirect effect above is in flight — render nothing rather than a
    // flash of dashboard chrome with no data behind it.
    return null;
  }

  return (
    <BlokmateToastProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          {!claims && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 md:px-6 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              Oturumunda henüz tenant_id/rol bilgisi yok — Supabase Auth Hook
              (Custom Access Token) etkin değil ya da hesabın public.users
              tablosunda henüz oluşturulmadı. Listeler bu durumda boş görünür.
            </div>
          )}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </BlokmateToastProvider>
  );
}
