import { supabase } from '@/lib/supabase';
import type { DogProfile, Message } from '@/types';

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
