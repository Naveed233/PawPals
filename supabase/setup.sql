-- ============================================================
-- PawPair — COMPLETE SETUP. Paste ALL of this into Supabase →
-- SQL Editor → New query → Run. Idempotent: safe to run again.
-- ============================================================

-- ========== schema.sql ==========
-- PawPair schema — paste into Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run (idempotent where possible).

-- ============================================================== profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  area text not null default '',
  bio text not null default '',
  age_range text,
  languages text[] not null default '{}',
  availability text[] not null default '{}',
  photo_url text,
  pet_status text not null default 'has-dog'
    check (pet_status in ('has-dog', 'has-other-pet', 'no-pet-meet', 'no-pet-future')),
  other_pet_type text,
  show_profile_to_matches boolean not null default true,
  -- approximate location only (rounded ~1km in the app); never a street address
  lat double precision,
  lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a profile row automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================== dogs
-- text ids so seed/demo dogs ('dog-luna') and real dogs (uuids) coexist.
create table if not exists public.dogs (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  breed text not null default '',
  age_years int not null default 1,
  sex text not null default 'female' check (sex in ('male', 'female')),
  size text not null default 'medium' check (size in ('small', 'medium', 'large')),
  weight_kg numeric,
  energy text not null default 'moderate',
  social text not null default 'social',
  personality text[] not null default '{}',
  play_style text[] not null default '{}',
  favourite text[] not null default '{}',
  vaccinated boolean not null default false,
  neutered boolean not null default false,
  good_with jsonb not null default '{}',
  recall text not null default 'improving',
  meetup_pref text not null default 'Leash walk',
  intents text[] not null default '{}',
  notes text,
  avoid text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================================================================ swipes
create table if not exists public.swipes (
  swiper_id uuid not null references public.profiles (id) on delete cascade,
  target_dog_id text not null, -- may reference a demo dog, so no FK
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  primary key (swiper_id, target_dog_id)
);

-- =============================================================== matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_a uuid not null references public.profiles (id) on delete cascade,
  owner_b uuid not null references public.profiles (id) on delete cascade,
  dog_a text,
  dog_b text,
  created_at timestamptz not null default now(),
  constraint matches_pair_unique unique (owner_a, owner_b),
  constraint matches_ordered check (owner_a < owner_b)
);

-- Mutual like → match, created atomically by the database (clients cannot
-- forge a match; they can only insert their own swipes).
create or replace function public.handle_mutual_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_owner uuid;
begin
  if new.direction <> 'like' then return new; end if;

  select owner_id into target_owner from public.dogs where id = new.target_dog_id;
  if target_owner is null or target_owner = new.swiper_id then return new; end if;

  -- Has the target dog's owner liked any of the swiper's dogs?
  if exists (
    select 1
    from public.swipes s
    join public.dogs d on d.id = s.target_dog_id
    where s.swiper_id = target_owner
      and s.direction = 'like'
      and d.owner_id = new.swiper_id
  ) then
    insert into public.matches (owner_a, owner_b, dog_a, dog_b)
    values (
      least(new.swiper_id, target_owner),
      greatest(new.swiper_id, target_owner),
      new.target_dog_id,
      null
    )
    on conflict (owner_a, owner_b) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_swipe_like on public.swipes;
create trigger on_swipe_like
  after insert on public.swipes
  for each row execute function public.handle_mutual_like();

-- ============================================================== messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ================================================================ events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  type text not null default 'Group walk',
  date_label text not null default '',
  time_label text not null default '',
  location_name text not null default '',
  area text not null default '',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ======================================================== row level security
alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;

-- profiles: discovery needs to read other owners' basics; writes are own-only.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- dogs: readable by all signed-in users (they ARE the discovery deck).
drop policy if exists dogs_select on public.dogs;
create policy dogs_select on public.dogs
  for select to authenticated using (true);
drop policy if exists dogs_write on public.dogs;
create policy dogs_write on public.dogs
  for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists dogs_update on public.dogs;
create policy dogs_update on public.dogs
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists dogs_delete on public.dogs;
create policy dogs_delete on public.dogs
  for delete to authenticated using (auth.uid() = owner_id);

-- swipes: you can only create/read your own.
drop policy if exists swipes_select on public.swipes;
create policy swipes_select on public.swipes
  for select to authenticated using (auth.uid() = swiper_id);
drop policy if exists swipes_insert on public.swipes;
create policy swipes_insert on public.swipes
  for insert to authenticated with check (auth.uid() = swiper_id);
drop policy if exists swipes_delete on public.swipes;
create policy swipes_delete on public.swipes
  for delete to authenticated using (auth.uid() = swiper_id);

-- matches/messages: participants only.
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select to authenticated using (auth.uid() in (owner_a, owner_b));
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated using (
    exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.owner_a, m.owner_b))
  );
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated with check (
    auth.uid() = sender_id
    and exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.owner_a, m.owner_b))
  );

-- events/rsvps: readable by all signed-in users; write own.
drop policy if exists events_select on public.events;
create policy events_select on public.events for select to authenticated using (true);
drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert to authenticated with check (auth.uid() = host_id);
drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps for select to authenticated using (true);
drop policy if exists rsvps_write on public.rsvps;
create policy rsvps_write on public.rsvps
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists rsvps_delete on public.rsvps;
create policy rsvps_delete on public.rsvps
  for delete to authenticated using (auth.uid() = user_id);

-- ================================================================ storage
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects
  for select using (bucket_id = 'photos');
drop policy if exists photos_upload on storage.objects;
create policy photos_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ========== hardening.sql ==========
-- PawPair — launch hardening. Paste into Supabase → SQL Editor → Run.
-- Idempotent: safe to run more than once. Apply AFTER schema.sql.
-- Closes the gaps found in the pre-launch security audit.

-- =====================================================================
-- 1. PROFILE PRIVACY — stop stranger scraping.
-- schema.sql let ANY signed-in user read EVERY profile row (bio, area,
-- lat/lon) via the raw API, which contradicts "profiles are private until
-- matched". Restrict reads to your own row or someone you've matched with.
-- (Discovery uses seed data today, so this does not remove any current
-- functionality; Phase-2 real discovery will read dogs, not raw profiles.)
-- =====================================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (
    auth.uid() = id
    or exists (
      select 1 from public.matches m
      where (m.owner_a = auth.uid() and m.owner_b = profiles.id)
         or (m.owner_b = auth.uid() and m.owner_a = profiles.id)
    )
  );

-- =====================================================================
-- 2. PAYLOAD LIMITS — a hostile user could otherwise upsert multi-MB text
-- into bio/notes/messages and inflate storage + egress (denial-of-wallet).
-- Generous but bounded caps.
-- =====================================================================
alter table public.profiles  drop constraint if exists profiles_len;
alter table public.profiles  add  constraint profiles_len check (
  char_length(first_name) <= 60
  and char_length(area) <= 120
  and char_length(bio) <= 800
  and char_length(coalesce(other_pet_type, '')) <= 40
  and coalesce(array_length(languages, 1), 0) <= 20
  and coalesce(array_length(availability, 1), 0) <= 20
);

alter table public.dogs      drop constraint if exists dogs_len;
alter table public.dogs      add  constraint dogs_len check (
  char_length(name) <= 60
  and char_length(breed) <= 60
  and char_length(coalesce(notes, '')) <= 800
  and char_length(coalesce(avoid, '')) <= 400
  and age_years between 0 and 40
  and (weight_kg is null or weight_kg between 0 and 200)
  and coalesce(array_length(photos, 1), 0) <= 12
);

alter table public.messages  drop constraint if exists messages_len;
alter table public.messages  add  constraint messages_len check (
  char_length(coalesce(body, '')) <= 2000
  and char_length(coalesce(image_url, '')) <= 500
);

alter table public.events    drop constraint if exists events_len;
alter table public.events    add  constraint events_len check (
  char_length(title) <= 120
  and char_length(coalesce(description, '')) <= 1000
  and char_length(location_name) <= 120
  and char_length(area) <= 120
);

-- =====================================================================
-- 3. STORAGE LIMITS — the photos bucket accepted files of any size / type.
-- Cap at 5 MB and images only.
-- =====================================================================
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'photos';

-- =====================================================================
-- 4. BLOCK & REPORT — real enforcement, not just UI. Required for a public
-- dating app (and for App Store review).
-- =====================================================================
create table if not exists public.blocked_users (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint no_self_block check (blocker <> blocked)
);
alter table public.blocked_users enable row level security;
drop policy if exists blocked_select on public.blocked_users;
create policy blocked_select on public.blocked_users
  for select to authenticated using (auth.uid() = blocker);
drop policy if exists blocked_insert on public.blocked_users;
create policy blocked_insert on public.blocked_users
  for insert to authenticated with check (auth.uid() = blocker);
drop policy if exists blocked_delete on public.blocked_users;
create policy blocked_delete on public.blocked_users
  for delete to authenticated using (auth.uid() = blocker);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles (id) on delete cascade,
  reported_owner uuid references public.profiles (id) on delete set null,
  reported_dog text,
  reason text check (char_length(coalesce(reason, '')) <= 500),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert to authenticated with check (auth.uid() = reporter);
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports
  for select to authenticated using (auth.uid() = reporter);

-- Block a blocked pair from messaging each other (either direction).
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.owner_a, m.owner_b)
    )
    and not exists (
      select 1
      from public.matches m
      join public.blocked_users b
        on b.blocker in (m.owner_a, m.owner_b)
       and b.blocked in (m.owner_a, m.owner_b)
      where m.id = match_id
    )
  );

-- Hide blocked users from each other's profile reads.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (
    auth.uid() = id
    or (
      exists (
        select 1 from public.matches m
        where (m.owner_a = auth.uid() and m.owner_b = profiles.id)
           or (m.owner_b = auth.uid() and m.owner_a = profiles.id)
      )
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker = auth.uid() and b.blocked = profiles.id)
           or (b.blocker = profiles.id and b.blocked = auth.uid())
      )
    )
  );

-- ========== phase2.sql ==========
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

-- ========== account.sql ==========
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

-- ========== premium.sql ==========
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


-- ========== meetups.sql ==========
-- PawPair — Map presence & "ask to join a walk" requests.
-- Paste into Supabase → SQL Editor → Run. Idempotent; safe to re-run.
-- Run AFTER setup.sql (schema + hardening + phase2 + premium).

-- =====================================================================
-- 1. MAP PRESENCE — opt-in. Users are OFF the map by default; turning on
-- "show me on the map" surfaces only an APPROXIMATE pin (the ~1km-rounded
-- lat/lon we already store) plus a short free-text availability note.
-- =====================================================================
alter table public.profiles add column if not exists available_to_meet boolean not null default false;
alter table public.profiles add column if not exists meet_note text;

alter table public.profiles drop constraint if exists profiles_meet_note_len;
alter table public.profiles add constraint profiles_meet_note_len
  check (char_length(coalesce(meet_note, '')) <= 60);

-- =====================================================================
-- 2. WALK REQUESTS — tapping a dog on the map sends a *request* with a short
-- intro, not an open DM. The recipient reviews it and accepts (→ becomes a
-- match + chat) or declines. Consent-gated: safer than free messaging.
-- =====================================================================
create table if not exists public.walk_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  dog_id text not null,
  message text check (char_length(coalesce(message, '')) <= 240),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint walk_req_not_self check (from_user <> to_user),
  constraint walk_req_unique unique (from_user, to_user, dog_id)
);
alter table public.walk_requests enable row level security;

-- sender & recipient can read the request
drop policy if exists walk_req_select on public.walk_requests;
create policy walk_req_select on public.walk_requests
  for select to authenticated using (auth.uid() in (from_user, to_user));

-- sender creates their own; blocked pairs cannot
drop policy if exists walk_req_insert on public.walk_requests;
create policy walk_req_insert on public.walk_requests
  for insert to authenticated with check (
    auth.uid() = from_user
    and from_user <> to_user
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker = auth.uid() and b.blocked = to_user)
         or (b.blocker = to_user and b.blocked = auth.uid())
    )
  );

-- recipient updates status (accept/decline)
drop policy if exists walk_req_update on public.walk_requests;
create policy walk_req_update on public.walk_requests
  for update to authenticated using (auth.uid() = to_user) with check (auth.uid() = to_user);

-- sender can cancel their pending request
drop policy if exists walk_req_delete on public.walk_requests;
create policy walk_req_delete on public.walk_requests
  for delete to authenticated using (auth.uid() = from_user);

-- Accept a request → create the match atomically, mark accepted, return match id.
create or replace function public.accept_walk_request(request_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  req public.walk_requests;
  m_id uuid;
begin
  select * into req from public.walk_requests where id = request_id and to_user = auth.uid();
  if req.id is null then raise exception 'request not found'; end if;

  update public.walk_requests set status = 'accepted' where id = request_id;

  insert into public.matches (owner_a, owner_b, dog_a, dog_b)
  values (
    least(req.from_user, req.to_user),
    greatest(req.from_user, req.to_user),
    req.dog_id,
    null
  )
  on conflict (owner_a, owner_b) do nothing;

  select id into m_id from public.matches
   where owner_a = least(req.from_user, req.to_user)
     and owner_b = greatest(req.from_user, req.to_user);

  -- Seed the conversation with the requester's intro, if any.
  if req.message is not null and char_length(req.message) > 0 then
    insert into public.messages (match_id, sender_id, body)
    values (m_id, req.from_user, req.message);
  end if;

  return m_id;
end $$;
grant execute on function public.accept_walk_request(uuid) to authenticated;

-- Incoming pending requests, with the sender's discovery-safe info.
create or replace function public.incoming_walk_requests()
returns table (
  id uuid,
  from_user uuid,
  dog_id text,
  message text,
  created_at timestamptz,
  from_name text,
  from_area text,
  dog_name text,
  dog_photos text[]
) language sql security definer stable set search_path = public as $$
  select r.id, r.from_user, r.dog_id, r.message, r.created_at,
         p.first_name, p.area, d.name, d.photos
  from public.walk_requests r
  join public.profiles p on p.id = r.from_user
  left join public.dogs d on d.id = r.dog_id
  where r.to_user = auth.uid() and r.status = 'pending'
  order by r.created_at desc
  limit 100;
$$;
grant execute on function public.incoming_walk_requests() to authenticated;

-- ========== events.sql ==========
-- PawPair — make hosted events visible to everyone (multi-user events).
-- Paste into Supabase → SQL Editor → Run. Idempotent. Run after setup.sql.
--
-- The events + rsvps tables already exist (with RLS). This adds the real
-- datetime / approx-location columns the app now uses, plus a helper that
-- lists every event with its attendee count and whether you're going.

alter table public.events add column if not exists starts_at timestamptz;
alter table public.events add column if not exists lat double precision;
alter table public.events add column if not exists lon double precision;

-- Length guard (matches the app's caps; generous but bounded).
alter table public.events drop constraint if exists events_len;
alter table public.events add constraint events_len check (
  char_length(title) <= 120
  and char_length(coalesce(description, '')) <= 1000
  and char_length(location_name) <= 120
  and char_length(area) <= 120
);

-- Every event + host name + attendee count + whether the caller has joined.
create or replace function public.list_events()
returns table (
  id uuid,
  host_id uuid,
  title text,
  type text,
  date_label text,
  time_label text,
  location_name text,
  area text,
  description text,
  starts_at timestamptz,
  lat double precision,
  lon double precision,
  created_at timestamptz,
  host_name text,
  attendee_count bigint,
  i_am_going boolean
) language sql security definer stable set search_path = public as $$
  select
    e.id, e.host_id, e.title, e.type, e.date_label, e.time_label,
    e.location_name, e.area, e.description, e.starts_at, e.lat, e.lon, e.created_at,
    p.first_name,
    (select count(*) from public.rsvps r where r.event_id = e.id),
    exists (select 1 from public.rsvps r where r.event_id = e.id and r.user_id = auth.uid())
  from public.events e
  join public.profiles p on p.id = e.host_id
  order by coalesce(e.starts_at, e.created_at) asc
  limit 200;
$$;
grant execute on function public.list_events() to authenticated;
