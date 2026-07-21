-- PawPair — in-app account deletion (App Store requirement). Run once.
--
-- Lets a signed-in user permanently delete their own account. Deleting the
-- auth.users row cascades to profiles → dogs → swipes → matches → messages →
-- events → rsvps → blocks/reports via the on-delete-cascade foreign keys.
-- SECURITY DEFINER so it runs with the rights needed to touch auth.users,
-- but it can only ever delete the *caller's own* row (auth.uid()).

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
