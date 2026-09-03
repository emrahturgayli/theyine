-- BlokMate — restore the Custom Access Token hook to the version from
-- 003_fix_role_claim_collision.sql. Something (a manual edit outside
-- these migrations) had since replaced it with a version that read
-- tenant_id/blokmate_role from `event -> 'user_metadata'` instead of
-- `public.users`, and apparently returned the bare `claims` object
-- instead of a JSON value carrying a top-level "claims" key — which is
-- what produced "output claims field is missing" at sign-in.
--
-- Two separate problems with that version, both fixed by reverting to
-- this one:
--
-- 1) `event -> 'user_metadata'` is never populated with tenant_id/role —
--    nothing in this codebase writes to Supabase Auth's user_metadata.
--    app/api/blokmate/register/route.ts (the only place a BlokMate user
--    is provisioned) inserts into `public.users` instead. Reading from
--    user_metadata will always yield null claims, independent of any
--    return-format fix.
--
-- 2) The Custom Access Token Hook contract, per Supabase's own
--    documentation, is: mutate the `claims` key inside the *whole*
--    `event` object and return that whole object —
--      event := jsonb_set(event, '{claims}', claims);
--      return event;
--    — not a bespoke `{"claims": {...}}` wrapper discarding the rest of
--    `event`. `event` already carries a top-level "claims" key by
--    construction, which is why returning it satisfies Supabase's check;
--    returning the bare `claims` variable directly (no wrapper at all)
--    is what triggers "output claims field is missing".
--
-- No SECURITY DEFINER here, deliberately: Supabase's docs advise against
-- it for this hook specifically. supabase_auth_admin instead gets a
-- direct GRANT + a permissive RLS policy on `public.users` (both from
-- 002, re-affirmed below in case they were dropped along with the
-- function during the interim edit).

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
    claims := jsonb_set(claims, '{blokmate_role}', to_jsonb(user_role));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on public.users to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users_auth_hook_select'
  ) then
    create policy users_auth_hook_select on public.users
      for select
      to supabase_auth_admin
      using (true);
  end if;
end $$;
