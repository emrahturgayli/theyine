"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { BlokmateToastProvider } from "@/lib/blokmate-toast";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import NoClaimsBanner from "./components/NoClaimsBanner";

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
          {!claims && <NoClaimsBanner />}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </BlokmateToastProvider>
  );
}
