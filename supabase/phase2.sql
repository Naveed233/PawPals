-- PawPair Phase 2 — real user discovery. Paste into Supabase → SQL Editor.
-- Run AFTER schema.sql and hardening.sql. Idempotent.
--
-- Discovery must show a dog's owner NAME + approximate AREA before matching,
-- but hardening.sql (correctly) keeps full profiles private until matched.
-- This function is the reconciliation: a SECURITY DEFINER read that returns
-- ONLY the discovery-safe owner fields (name, area, approx lat/lon) — never
-- bio or private details — for other users' dogs, excluding blocked pairs.

create or replace function public.discover_dogs()
returns table (
  id text,
  owner_id uuid,
  name text,
  breed text,
  age_years int,
  sex text,
  size text,
  weight_kg numeric,
  energy text,
  social text,
  personality text[],
  play_style text[],
  favourite text[],
  vaccinated boolean,
  neutered boolean,
  good_with jsonb,
  recall text,
  meetup_pref text,
  intents text[],
  notes text,
  avoid text,
  photos text[],
  owner_first_name text,
  owner_area text,
  owner_lat double precision,
  owner_lon double precision
)
language sql
security definer
stable
set search_path = public
as $$
  select
    d.id, d.owner_id, d.name, d.breed, d.age_years, d.sex, d.size, d.weight_kg,
    d.energy, d.social, d.personality, d.play_style, d.favourite, d.vaccinated,
    d.neutered, d.good_with, d.recall, d.meetup_pref, d.intents, d.notes, d.avoid, d.photos,
    p.first_name, p.area, p.lat, p.lon
  from public.dogs d
  join public.profiles p on p.id = d.owner_id
  where d.owner_id <> auth.uid()
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker = auth.uid() and b.blocked = d.owner_id)
         or (b.blocker = d.owner_id and b.blocked = auth.uid())
    )
  limit 200;
$$;

grant execute on function public.discover_dogs() to authenticated;
