import { supabase } from '@/lib/supabase';
import type { DogProfile, Message, PawEvent } from '@/types';

/**
 * Real user-to-user data layer (Phase 2). Local seed content keeps the app
 * populated; these helpers add real dogs into discovery, real matches, and
 * realtime chat. Every call is failure-tolerant.
 */

type DogRow = {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  age_years: number;
  sex: string;
  size: string;
  weight_kg: number | null;
  energy: string;
  social: string;
  personality: string[] | null;
  play_style: string[] | null;
  favourite: string[] | null;
  vaccinated: boolean;
  neutered: boolean;
  good_with: Record<string, boolean> | null;
  recall: string;
  meetup_pref: string;
  intents: string[] | null;
  notes: string | null;
  avoid: string | null;
  photos: string[] | null;
  owner?: { id: string; first_name: string; area: string; lat: number | null; lon: number | null } | null;
};

/** Great-circle distance in km, rounded to 1 decimal. */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

/** Stable pseudo-distance (1–9 km) from a dog id, for when geo is unknown. */
function pseudoKm(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 900;
  return Math.round((1 + (h / 900) * 8) * 10) / 10;
}

function rowToProfile(d: DogRow, myLat?: number | null, myLon?: number | null): DogProfile {
  const distanceKm =
    myLat != null && myLon != null && d.owner?.lat != null && d.owner?.lon != null
      ? haversineKm(myLat, myLon, d.owner.lat, d.owner.lon)
      : pseudoKm(d.id);
  return {
    id: d.id,
    ownerId: d.owner_id,
    ownerName: d.owner?.first_name || '',
    ownerArea: d.owner?.area || '',
    ownerVerified: false,
    name: d.name,
    photos: d.photos ?? [],
    intents: (d.intents ?? []) as DogProfile['intents'],
    breed: d.breed,
    ageYears: d.age_years,
    sex: d.sex as DogProfile['sex'],
    size: d.size as DogProfile['size'],
    weightKg: Number(d.weight_kg ?? 0),
    energy: d.energy as DogProfile['energy'],
    social: d.social as DogProfile['social'],
    personality: d.personality ?? [],
    playStyle: d.play_style ?? [],
    favourite: d.favourite ?? [],
    vaccinated: d.vaccinated,
    neutered: d.neutered,
    goodWith: (d.good_with ?? {}) as unknown as DogProfile['goodWith'],
    recall: d.recall as DogProfile['recall'],
    meetupPref: d.meetup_pref as DogProfile['meetupPref'],
    notes: d.notes ?? undefined,
    avoid: d.avoid ?? undefined,
    distanceKm,
    lat: d.owner?.lat ?? undefined,
    lon: d.owner?.lon ?? undefined,
  };
}

const DOG_SELECT =
  '*, owner:profiles!dogs_owner_id_fkey(id, first_name, area, lat, lon)';

/**
 * Other users' dogs for the discovery deck. Uses the discover_dogs() RPC
 * (phase2.sql) which exposes only discovery-safe owner fields — full profiles
 * stay private until matched. Degrades to seed-only if the RPC isn't installed.
 */
export async function fetchDiscoverDogs(
  myLat?: number | null,
  myLon?: number | null,
): Promise<DogProfile[]> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user.id) return [];

    const { data, error } = await supabase.rpc('discover_dogs');
    if (error) {
      console.warn('[remote] discover_dogs rpc:', error.message);
      return [];
    }
    type FlatRow = Omit<DogRow, 'owner'> & {
      owner_first_name: string | null;
      owner_area: string | null;
      owner_lat: number | null;
      owner_lon: number | null;
    };
    return (data as FlatRow[]).map((r) =>
      rowToProfile(
        {
          ...r,
          owner: {
            id: r.owner_id,
            first_name: r.owner_first_name ?? '',
            area: r.owner_area ?? '',
            lat: r.owner_lat,
            lon: r.owner_lon,
          },
        },
        myLat,
        myLon,
      ),
    );
  } catch (e) {
    console.warn('[remote] fetchDiscoverDogs:', e);
    return [];
  }
}

export interface RemoteMatch {
  matchId: string;
  otherOwnerId: string;
  dog: DogProfile | null; // one of the other owner's dogs, to display
  createdAt: number;
}

/** Real matches (from the DB trigger), each with the other owner's dog. */
export async function fetchRemoteMatches(): Promise<RemoteMatch[]> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return [];

    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`owner_a.eq.${uid},owner_b.eq.${uid}`);
    if (error || !matches?.length) return [];

    const otherIds = matches.map((m) => (m.owner_a === uid ? m.owner_b : m.owner_a));
    const { data: dogRows } = await supabase
      .from('dogs')
      .select(DOG_SELECT)
      .in('owner_id', otherIds);
    const byOwner = new Map<string, DogRow>();
    for (const d of (dogRows ?? []) as DogRow[]) {
      if (!byOwner.has(d.owner_id)) byOwner.set(d.owner_id, d);
    }

    return matches.map((m) => {
      const other = m.owner_a === uid ? m.owner_b : m.owner_a;
      const row = byOwner.get(other);
      return {
        matchId: m.id,
        otherOwnerId: other,
        dog: row ? rowToProfile(row) : null,
        createdAt: Date.parse(m.created_at) || 0,
      };
    });
  } catch (e) {
    console.warn('[remote] fetchRemoteMatches:', e);
    return [];
  }
}

/* ------------------------------------------------------------- realtime chat */

type MsgRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
};

function rowToMessage(m: MsgRow, myId: string): Message {
  const at = Date.parse(m.created_at) || 0;
  const sender = m.sender_id === myId ? 'me' : 'them';
  if (m.image_url) return { id: m.id, sender, kind: 'image', uri: m.image_url, at };
  return { id: m.id, sender, kind: 'text', text: m.body ?? '', at };
}

export async function fetchMessages(matchId: string): Promise<Message[]> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data as MsgRow[]).map((m) => rowToMessage(m, uid));
  } catch {
    return [];
  }
}

export async function sendMessage(
  matchId: string,
  body: string,
  imageUrl?: string,
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return false;
    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: uid,
      body: body || null,
      image_url: imageUrl ?? null,
    });
    if (error) {
      console.warn('[remote] sendMessage:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Subscribe to new messages in a match. Returns an unsubscribe function. */
export function subscribeMessages(
  matchId: string,
  myId: string,
  onMessage: (m: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => onMessage(rowToMessage(payload.new as MsgRow, myId)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Real users who liked one of my dogs but I haven't swiped back yet — the
 * data behind the Premium "Who liked you" screen. Uses the who_liked_me()
 * RPC (premium.sql) which returns discovery-safe dog + owner fields.
 */
export async function fetchWhoLikedMe(): Promise<DogProfile[]> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user.id) return [];
    const { data, error } = await supabase.rpc('who_liked_me');
    if (error) {
      console.warn('[remote] who_liked_me:', error.message);
      return [];
    }
    type FlatRow = Omit<DogRow, 'owner'> & {
      owner_first_name: string | null;
      owner_area: string | null;
      owner_lat: number | null;
      owner_lon: number | null;
    };
    return (data as FlatRow[]).map((r) =>
      rowToProfile({
        ...r,
        owner: {
          id: r.owner_id,
          first_name: r.owner_first_name ?? '',
          area: r.owner_area ?? '',
          lat: r.owner_lat,
          lon: r.owner_lon,
        },
      }),
    );
  } catch (e) {
    console.warn('[remote] fetchWhoLikedMe:', e);
    return [];
  }
}

/** Activate a boost for the current user (surfaces higher to others). */
export async function activateBoost(minutes = 30): Promise<number | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return null;
    const until = new Date(Date.now() + minutes * 60_000).toISOString();
    const { error } = await supabase.from('profiles').update({ boosted_until: until }).eq('id', uid);
    if (error) {
      console.warn('[remote] activateBoost:', error.message);
      return null;
    }
    return Date.parse(until);
  } catch {
    return null;
  }
}

/* ------------------------------------------------- moderation & account */

/** Block another owner (both directions of messaging/visibility stop). */
export async function blockUser(ownerId: string): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid || !ownerId || ownerId === uid) return false;
    const { error } = await supabase
      .from('blocked_users')
      .upsert({ blocker: uid, blocked: ownerId });
    if (error) console.warn('[remote] blockUser:', error.message);
    return !error;
  } catch {
    return false;
  }
}

/** File a report against an owner and/or a specific dog. */
export async function reportContent(
  reportedOwner: string | null,
  reportedDog: string | null,
  reason: string,
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return false;
    const { error } = await supabase.from('reports').insert({
      reporter: uid,
      reported_owner: reportedOwner,
      reported_dog: reportedDog,
      reason: reason.slice(0, 500),
    });
    if (error) console.warn('[remote] reportContent:', error.message);
    return !error;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------ walk requests
// "Ask to join a walk": a consent-gated request (not an open DM). The
// recipient accepts (→ match + chat) or declines.

/** Send a walk request with a short intro. Returns true on success. */
export async function sendWalkRequest(
  toUser: string,
  dogId: string,
  message: string,
): Promise<{ ok: boolean; reason?: 'duplicate' | 'error' }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid || !toUser || toUser === uid) return { ok: false, reason: 'error' };
    const { error } = await supabase.from('walk_requests').insert({
      from_user: uid,
      to_user: toUser,
      dog_id: dogId,
      message: message.slice(0, 240),
    });
    if (error) {
      // 23505 = unique violation → already requested this dog.
      if (error.code === '23505') return { ok: false, reason: 'duplicate' };
      console.warn('[remote] sendWalkRequest:', error.message);
      return { ok: false, reason: 'error' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export interface IncomingWalkRequest {
  id: string;
  fromUser: string;
  dogId: string;
  message: string | null;
  createdAt: string;
  fromName: string;
  fromArea: string;
  dogName: string | null;
  dogPhotos: string[];
}

/** Pending walk requests sent to me. */
export async function fetchIncomingWalkRequests(): Promise<IncomingWalkRequest[]> {
  try {
    const { data, error } = await supabase.rpc('incoming_walk_requests');
    if (error) {
      console.warn('[remote] incomingWalkRequests:', error.message);
      return [];
    }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      fromUser: r.from_user as string,
      dogId: r.dog_id as string,
      message: (r.message as string) ?? null,
      createdAt: r.created_at as string,
      fromName: (r.from_name as string) ?? '',
      fromArea: (r.from_area as string) ?? '',
      dogName: (r.dog_name as string) ?? null,
      dogPhotos: (r.dog_photos as string[]) ?? [],
    }));
  } catch {
    return [];
  }
}

/** Accept a walk request → creates the match. Returns the match id (or null). */
export async function acceptWalkRequest(requestId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('accept_walk_request', { request_id: requestId });
    if (error) {
      console.warn('[remote] acceptWalkRequest:', error.message);
      return null;
    }
    return (data as string) ?? null;
  } catch {
    return null;
  }
}

/** Decline a walk request. */
export async function declineWalkRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('walk_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);
    if (error) console.warn('[remote] declineWalkRequest:', error.message);
    return !error;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------- events
// Real, multi-user events: a hosted event lands in the DB so everyone sees it.

/** Insert an event the user is hosting. Returns true on success. */
export async function createEventRemote(e: PawEvent): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return false;
    const { error } = await supabase.from('events').insert({
      id: e.id,
      host_id: uid,
      title: e.title,
      type: e.type,
      date_label: e.dateLabel,
      time_label: e.timeLabel,
      location_name: e.locationName,
      area: e.area,
      description: e.description || null,
      starts_at: e.startsAt ?? null,
      lat: e.lat ?? null,
      lon: e.lon ?? null,
    });
    if (error) console.warn('[remote] createEvent:', error.message);
    return !error;
  } catch {
    return false;
  }
}

/** All events with host name + attendee counts, plus which ids I've joined. */
export async function fetchEvents(): Promise<{ events: PawEvent[]; going: string[] } | null> {
  try {
    const { data, error } = await supabase.rpc('list_events');
    if (error) {
      console.warn('[remote] fetchEvents:', error.message);
      return null;
    }
    const rows = (data ?? []) as Record<string, unknown>[];
    const events: PawEvent[] = rows.map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? '',
      type: (r.type as PawEvent['type']) ?? 'Group walk',
      hostOwnerId: r.host_id as string,
      hostName: (r.host_name as string) ?? '',
      locationName: (r.location_name as string) ?? '',
      area: (r.area as string) ?? '',
      dateLabel: (r.date_label as string) ?? '',
      timeLabel: (r.time_label as string) ?? '',
      description: (r.description as string) ?? '',
      // attendeeCount excludes me (the UI adds +1 when I'm going).
      attendeeCount: Math.max(0, Number(r.attendee_count ?? 0) - (r.i_am_going ? 1 : 0)),
      startsAt: (r.starts_at as string) ?? undefined,
      lat: (r.lat as number) ?? undefined,
      lon: (r.lon as number) ?? undefined,
    }));
    const going = rows.filter((r) => r.i_am_going).map((r) => r.id as string);
    return { events, going };
  } catch {
    return null;
  }
}

/** Join / leave an event (rsvps table). */
export async function setEventRsvpRemote(eventId: string, going: boolean): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return;
    if (going) {
      await supabase.from('rsvps').upsert({ event_id: eventId, user_id: uid });
    } else {
      await supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', uid);
    }
  } catch {
    /* offline / not-installed — local RSVP still applied */
  }
}

/** Permanently delete the current user's account and all their data. */
export async function deleteOwnAccount(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      console.warn('[remote] deleteOwnAccount:', error.message);
      return false;
    }
    await supabase.auth.signOut();
    return true;
  } catch {
    return false;
  }
}

/** Subscribe to new matches for the current user. Returns unsubscribe. */
export function subscribeMatches(myId: string, onMatch: () => void): () => void {
  const channel = supabase
    .channel(`matches:${myId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'matches' },
      (payload) => {
        const m = payload.new as { owner_a: string; owner_b: string };
        if (m.owner_a === myId || m.owner_b === myId) onMatch();
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
