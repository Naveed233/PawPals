-- PawPair — pre-launch security/privacy fixes. Paste into Supabase → SQL Editor
-- → Run. Idempotent; run after setup.sql. Fixes issues found in the pre-launch
-- audit before sharing the app publicly.

-- =====================================================================
-- 1. MAP OPT-IN IS REAL NOW. discover_dogs() also returns available_to_meet
-- so the client can plot ONLY users who turned on "show me on the map".
-- (Keeps the boost ordering from premium.sql.)
-- =====================================================================
create or replace function public.discover_dogs()
returns table (
  id text, owner_id uuid, name text, breed text, age_years int, sex text, size text,
  weight_kg numeric, energy text, social text, personality text[], play_style text[],
  favourite text[], vaccinated boolean, neutered boolean, good_with jsonb, recall text,
  meetup_pref text, intents text[], notes text, avoid text, photos text[],
  owner_first_name text, owner_area text, owner_lat double precision, owner_lon double precision,
  owner_available_to_meet boolean
)
language sql security definer stable set search_path = public as $$
  select
    d.id, d.owner_id, d.name, d.breed, d.age_years, d.sex, d.size, d.weight_kg,
    d.energy, d.social, d.personality, d.play_style, d.favourite, d.vaccinated,
    d.neutered, d.good_with, d.recall, d.meetup_pref, d.intents, d.notes, d.avoid, d.photos,
    p.first_name, p.area, p.lat, p.lon, coalesce(p.available_to_meet, false)
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

-- =====================================================================
-- 2. RSVP ROSTER PRIVACY. The attendee list was world-readable (using true),
-- exposing who attends which meetup + where/when. Scope reads to your own row;
-- counts still work via the SECURITY DEFINER list_events() RPC.
-- =====================================================================
drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- 3. EVENTS: hosts can delete/cancel their own event, and list_events() hides
-- events that have already finished.
-- =====================================================================
drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete to authenticated using (auth.uid() = host_id);

create or replace function public.list_events()
returns table (
  id uuid, host_id uuid, title text, type text, date_label text, time_label text,
  location_name text, area text, description text, starts_at timestamptz,
  lat double precision, lon double precision, created_at timestamptz,
  host_name text, attendee_count bigint, i_am_going boolean
) language sql security definer stable set search_path = public as $$
  select
    e.id, e.host_id, e.title, e.type, e.date_label, e.time_label,
    e.location_name, e.area, e.description, e.starts_at, e.lat, e.lon, e.created_at,
    p.first_name,
    (select count(*) from public.rsvps r where r.event_id = e.id),
    exists (select 1 from public.rsvps r where r.event_id = e.id and r.user_id = auth.uid())
  from public.events e
  join public.profiles p on p.id = e.host_id
  -- hide events that already finished (keep undated + anything up to 6h past start)
  where e.starts_at is null or e.starts_at >= now() - interval '6 hours'
  order by coalesce(e.starts_at, e.created_at) asc
  limit 200;
$$;
grant execute on function public.list_events() to authenticated;

-- =====================================================================
-- 4. REALTIME. Enable live delivery for chat messages + matches so sent
-- messages and new matches arrive without a refresh. Idempotent.
-- =====================================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null; end $$;
