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
