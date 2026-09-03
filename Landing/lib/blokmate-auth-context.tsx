"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getBlokmateSupabaseBrowser,
  parseBlokmateClaims,
} from "@/lib/blokmate-supabase-browser";
import type { BlokmateJwtClaims } from "@/lib/blokmate";

/**
 * Session + tenant/role claims for the whole /blokmate app tree. Mounted
 * once in app/blokmate/layout.tsx so both the public marketing page
 * (which never reads it) and the authenticated (app) route group (which
 * gates every page on it) share one Supabase auth subscription instead of
 * each page re-subscribing.
 *
 * `claims` is null in two genuinely different situations this type can't
 * tell apart on its own: (a) nobody is signed in, or (b) someone is
 * signed in but the Custom Access Token hook hasn't populated
 * tenant_id/blokmate_role yet (see supabase/migrations/003_fix_role_claim_collision.sql).
 * `session` distinguishes them — check `session` first if you need to
 * tell "logged out" apart from "logged in but claims still missing".
 */
type BlokmateAuthState = {
  session: Session | null;
  claims: BlokmateJwtClaims | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const BlokmateAuthContext = createContext<BlokmateAuthState | null>(null);

export function BlokmateAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [claims, setClaims] = useState<BlokmateJwtClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBlokmateSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setClaims(session ? parseBlokmateClaims(session.access_token) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setClaims(session ? parseBlokmateClaims(session.access_token) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const supabase = getBlokmateSupabaseBrowser();
    if (!supabase) return { error: "Supabase yapılandırılmamış." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    const supabase = getBlokmateSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <BlokmateAuthContext.Provider value={{ session, claims, loading, signIn, signOut }}>
      {children}
    </BlokmateAuthContext.Provider>
  );
}

export function useBlokmateAuth(): BlokmateAuthState {
  const ctx = useContext(BlokmateAuthContext);
  if (!ctx) throw new Error("useBlokmateAuth must be used within BlokmateAuthProvider");
  return ctx;
}
