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
