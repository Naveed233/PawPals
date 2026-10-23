-- PawPair — RPCs for signed-in users only. Paste into Supabase → SQL Editor → Run.
-- Idempotent: safe to run more than once. Apply AFTER setup.sql (also appended there).
--
-- Postgres lets everyone (PUBLIC) execute a new function unless told otherwise, so the
-- signed-out `anon` role could call every RPC through /rest/v1/rpc/*. They are SECURITY
-- DEFINER (they read across rows that RLS would hide), so the only thing stopping a
-- signed-out caller was `auth.uid()` being NULL. That is luck, not a lock.

-- The app's RPCs: signed-in users (and the service role) only.
revoke execute on function public.discover_dogs(), public.who_liked_me(), public.incoming_walk_requests(),
  public.accept_walk_request(uuid), public.list_events(), public.delete_own_account() from public, anon;
grant execute on function public.discover_dogs(), public.who_liked_me(), public.incoming_walk_requests(),
  public.accept_walk_request(uuid), public.list_events(), public.delete_own_account() to authenticated, service_role;

-- Trigger functions are never called through the API. Postgres checks EXECUTE when a
-- trigger is created, not when it fires, so the triggers keep working.
revoke execute on function public.handle_mutual_like(), public.handle_new_user() from public, anon, authenticated;
-- rls_auto_enable() is created by Supabase itself (Database → "auto-enable RLS"), so it may not exist.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
