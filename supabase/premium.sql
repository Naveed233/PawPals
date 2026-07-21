-- PawPair — Premium feature support (free for now, badged in the UI).
-- Run AFTER schema.sql, hardening.sql, phase2.sql. Idempotent.

-- ----------------------------------------------------------------- boost
-- A boosted profile surfaces higher in discovery for a short window.
alter table public.profiles add column if not exists boosted_until timestamptz;

-- Re-create discover_dogs() to order boosted profiles first (still exposes
-- only discovery-safe owner fields; blocked pairs excluded).
create or replace function public.discover_dogs()
returns table (
  id text, owner_id uuid, name text, breed text, age_years int, sex text, size text,
  weight_kg numeric, energy text, social text, personality text[], play_style text[],
  favourite text[], vaccinated boolean, neutered boolean, good_with jsonb, recall text,
  meetup_pref text, intents text[], notes text, avoid text, photos text[],
  owner_first_name text, owner_area text, owner_lat double precision, owner_lon double precision
)
language sql security definer stable set search_path = public as $$
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
  order by
    (p.boosted_until is not null and p.boosted_until > now()) desc,
    p.boosted_until desc nulls last
  limit 200;
$$;
grant execute on function public.discover_dogs() to authenticated;

-- ------------------------------------------------------------ who liked me
-- Dogs whose owners liked one of MY dogs, that I haven't swiped on yet.
-- SECURITY DEFINER so it can read others' swipes/profiles safely, exposing
-- only discovery-safe fields.
create or replace function public.who_liked_me()
returns table (
  id text, owner_id uuid, name text, breed text, age_years int, sex text, size text,
  weight_kg numeric, energy text, social text, personality text[], play_style text[],
  favourite text[], vaccinated boolean, neutered boolean, good_with jsonb, recall text,
  meetup_pref text, intents text[], notes text, avoid text, photos text[],
  owner_first_name text, owner_area text, owner_lat double precision, owner_lon double precision
)
language sql security definer stable set search_path = public as $$
  select distinct on (d.id)
    d.id, d.owner_id, d.name, d.breed, d.age_years, d.sex, d.size, d.weight_kg,
    d.energy, d.social, d.personality, d.play_style, d.favourite, d.vaccinated,
    d.neutered, d.good_with, d.recall, d.meetup_pref, d.intents, d.notes, d.avoid, d.photos,
    p.first_name, p.area, p.lat, p.lon
  from public.swipes s
  join public.dogs my on my.id = s.target_dog_id and my.owner_id = auth.uid()
  join public.dogs d on d.owner_id = s.swiper_id
  join public.profiles p on p.id = d.owner_id
  where s.direction = 'like'
    and s.swiper_id <> auth.uid()
    -- exclude ones I've already swiped on
    and not exists (
      select 1 from public.swipes mine
      where mine.swiper_id = auth.uid() and mine.target_dog_id = d.id
    )
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker = auth.uid() and b.blocked = d.owner_id)
         or (b.blocker = d.owner_id and b.blocked = auth.uid())
    )
  limit 100;
$$;
grant execute on function public.who_liked_me() to authenticated;
