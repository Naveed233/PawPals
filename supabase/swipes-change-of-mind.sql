-- PawPair — let a user change their own swipe. Paste into Supabase → SQL Editor → Run.
-- Idempotent: safe to run more than once. Apply AFTER setup.sql (also appended there).
--
-- The app saves a swipe with upsert: insert it, or update it if that dog was swiped
-- before. swipes had no UPDATE policy, so RLS refused the update half (HTTP 403) and a
-- second swipe on the same dog, such as a pass in the deck and then a like from the
-- dog's profile, was silently lost.

drop policy if exists swipes_update on public.swipes;
create policy swipes_update on public.swipes
  for update to authenticated
  using (auth.uid() = swiper_id)
  with check (auth.uid() = swiper_id);

-- A like that arrives as an update (pass → like) must create the match too, or the
-- match only appears if the other owner happens to like again. handle_mutual_like()
-- already ignores passes and inserts the match with ON CONFLICT DO NOTHING, so it is
-- safe to run on every write of `direction`.
create or replace trigger on_swipe_like
  after insert or update of direction on public.swipes
  for each row execute function public.handle_mutual_like();
