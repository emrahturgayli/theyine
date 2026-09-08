/**
 * Server-only counterpart to lib/blokmate-supabase-browser.ts's
 * parseBlokmateClaims() — decodes a Supabase access token's payload
 * without a network round-trip, for API routes (app/api/payments/*) that
 * receive the token as a Bearer header rather than holding a session
 * themselves. This is NOT signature verification: it trusts the token's
 * claims are genuine because Supabase Auth issued and signed it, the same
 * assumption every RLS policy in this schema makes about auth.jwt(). A
 * route that needs stronger guarantees (this one doesn't — it only reads
 * tenant_id/role/sub to scope a service-role query, and that query's own
 * WHERE clauses are what actually authorize the action) would need to
 * verify the JWT signature against Supabase's JWKS instead.
 */
export type BlokmateServerClaims = {
  userId: string;
  tenantId: string;
  role: "manager" | "resident" | "accountant" | "auditor" | "staff";
};

export function decodeBlokmateAccessToken(token: string): BlokmateServerClaims | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.tenant_id !== "string" ||
      typeof payload.blokmate_role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.sub,
      tenantId: payload.tenant_id,
      role: payload.blokmate_role as BlokmateServerClaims["role"],
    };
  } catch {
    return null;
  }
}
