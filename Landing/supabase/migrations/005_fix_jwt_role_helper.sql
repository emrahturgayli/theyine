-- BlokMate — blokmate_jwt_role() was still reading auth.jwt() ->> 'role'
-- (Supabase's reserved claim, always "authenticated"/"anon") instead of
-- 'blokmate_role', despite 003_fix_role_claim_collision.sql redefining
-- it. It was apparently overwritten again during the interim edits to
-- custom_access_token_hook() that 004 reverted.
--
-- Confirmed live via RPC probe: blokmate_jwt_role() returned
-- "authenticated" for a manager whose JWT already had the correct
-- blokmate_role="manager" claim (blokmate_jwt_tenant_id() was fine, only
-- this function was stale). This is what caused "manager sees own-tenant
-- invoice" to fail in verify-rls.mjs — every RLS policy's
-- `blokmate_jwt_role() in ('manager', ...)` check was comparing against
-- "authenticated", never matching, and residents' unit_id fallback also
-- doesn't apply to managers (no unit_id), so managers were seeing zero
-- rows instead of their whole tenant.

create or replace function blokmate_jwt_role() returns text
language sql stable
as $$
  select auth.jwt() ->> 'blokmate_role';
$$;
