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
