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
