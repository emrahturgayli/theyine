-- BlokMate — fix a claim-name collision found while verifying migration
-- 002's Auth Hook against a real project (before the hook was ever
-- enabled in Studio, so this never reached production).
--
-- 002's custom_access_token_hook() wrote the caller's app role into the
-- JWT's top-level "role" claim. That claim is NOT free real estate — it's
-- the one PostgREST reads to decide which Postgres role to SET ROLE to
-- for the request (normally "authenticated" or "anon"). Overwriting it
-- with "manager"/"resident"/etc. would have made PostgREST try to assume
-- a Postgres role that doesn't exist, breaking every authenticated
-- request on this project, not just BlokMate's tables.
--
-- Fix: the app role now goes into its own claim, "blokmate_role", and the
-- hook no longer touches "role" at all. blokmate_jwt_role() (used by every
-- RLS policy from 002) is redefined to read the new claim name — no
-- policy definitions need to change, they all go through this function.

create or replace function blokmate_jwt_role() returns text
language sql stable
as $$
  select auth.jwt() ->> 'blokmate_role';
$$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_tenant_id uuid;
  user_role text;
begin
  select tenant_id, role
    into user_tenant_id, user_role
    from public.users
    where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  if user_tenant_id is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
  end if;
  if user_role is not null then
    -- "blokmate_role", never "role" — see header comment.
    claims := jsonb_set(claims, '{blokmate_role}', to_jsonb(user_role));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;
