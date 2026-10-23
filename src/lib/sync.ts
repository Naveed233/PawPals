import { removeOwnPhotos } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { DogProfile, OwnerProfile, SwipeDirection } from '@/types';

/**
 * Server persistence for the signed-in user's own data.
 *
 * Local zustand state stays the source of truth for the UI (the app keeps
 * working offline and with the demo content); these helpers mirror the user's
 * profile/dogs/swipes to Supabase, and hydrate them back on sign-in. Every
 * call is failure-tolerant: if the schema isn't installed yet or the network
 * is down we log and move on rather than break the app.
 *
 * Reads are the exception. A failed read says nothing about whether a profile
 * exists, so `fetchRemoteState` reports it as `error`, never as "no profile":
 * that would send a returning user to onboarding, and finishing onboarding
 * overwrites the profile they saved.
 */

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function saveProfileRemote(owner: OwnerProfile): Promise<void> {
  try {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase.from('profiles').upsert({
      id,
      first_name: owner.firstName,
      area: owner.area,
      bio: owner.bio,
      age_range: owner.ageRange ?? null,
      languages: owner.languages,
      availability: owner.availability,
      pet_status: owner.petStatus ?? 'has-dog',
      other_pet_type: owner.otherPetType ?? null,
      show_profile_to_matches: owner.showProfileToMatches ?? true,
      photo_url: owner.photo ?? null,
      lat: owner.lat ?? null,
      lon: owner.lon ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[sync] saveProfile failed:', error.message);
  } catch (e) {
    console.warn('[sync] saveProfile failed:', e);
  }
}

/**
 * Map presence (available_to_meet / meet_note) is written on its own so a
 * database that hasn't yet run meetups.sql (missing those columns) never
 * breaks the core profile save — this targeted update just fails gracefully.
 */
export async function saveMeetPresence(
  availableToMeet: boolean,
  meetNote: string | null,
): Promise<void> {
  try {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ available_to_meet: availableToMeet, meet_note: meetNote })
      .eq('id', id);
    if (error) console.warn('[sync] saveMeetPresence failed:', error.message);
  } catch (e) {
    console.warn('[sync] saveMeetPresence failed:', e);
  }
}

/**
 * Save the user's approximate location (rounded upstream for privacy). Written
 * on its own — like presence — so it never blocks the core profile save, and so
 * that others can find them on the map once they've opted in.
 */
export async function saveLocationRemote(lat: number, lon: number): Promise<void> {
  try {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase.from('profiles').update({ lat, lon }).eq('id', id);
    if (error) console.warn('[sync] saveLocationRemote failed:', error.message);
  } catch (e) {
    console.warn('[sync] saveLocationRemote failed:', e);
  }
}

export async function saveDogRemote(dog: DogProfile): Promise<void> {
  try {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase.from('dogs').upsert({
      id: dog.id,
      owner_id: id,
      name: dog.name,
      breed: dog.breed,
      age_years: dog.ageYears,
      sex: dog.sex,
      size: dog.size,
      weight_kg: dog.weightKg || null,
      energy: dog.energy,
      social: dog.social,
      personality: dog.personality,
      play_style: dog.playStyle,
      favourite: dog.favourite,
      vaccinated: dog.vaccinated,
      neutered: dog.neutered,
      good_with: dog.goodWith,
      recall: dog.recall,
      meetup_pref: dog.meetupPref,
      intents: dog.intents,
      notes: dog.notes ?? null,
      avoid: dog.avoid ?? null,
      photos: dog.photos ?? [],
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[sync] saveDog failed:', error.message);
  } catch (e) {
    console.warn('[sync] saveDog failed:', e);
  }
}

/**
 * Delete one of the user's dogs on the server, then its uploaded photos.
 * Returns false when the server delete did not happen, so the caller keeps
 * the dog: removing it only on this device would bring it back at the next
 * sign-in. Unlike the saves above, this one is not fire-and-forget.
 */
export async function deleteDogRemote(dog: DogProfile): Promise<boolean> {
  try {
    const id = await userId();
    if (!id) return false;
    const { error } = await supabase.from('dogs').delete().eq('id', dog.id).eq('owner_id', id);
    if (error) {
      console.warn('[sync] deleteDog failed:', error.message);
      return false;
    }
  } catch (e) {
    console.warn('[sync] deleteDog failed:', e);
    return false;
  }
  await removeOwnPhotos(dog.photos ?? []);
  return true;
}

export function recordSwipeRemote(targetDogId: string, direction: SwipeDirection): void {
  void (async () => {
    try {
      const id = await userId();
      if (!id) return;
      const { error } = await supabase
        .from('swipes')
        .upsert({ swiper_id: id, target_dog_id: targetDogId, direction });
      if (error) console.warn('[sync] recordSwipe failed:', error.message);
    } catch (e) {
      console.warn('[sync] recordSwipe failed:', e);
    }
  })();
}

/** What the server holds for the signed-in account (see the note at the top). */
export type RemoteState =
  | { status: 'ok'; owner: OwnerProfile | null; dogs: DogProfile[] }
  | { status: 'signed-out' }
  | { status: 'error' };

export async function fetchRemoteState(): Promise<RemoteState> {
  try {
    const id = await userId();
    if (!id) return { status: 'signed-out' };

    const [profileRes, dogsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('dogs').select('*').eq('owner_id', id),
    ]);
    const failed = profileRes.error ?? dogsRes.error;
    if (failed) {
      console.warn('[sync] fetchRemoteState failed:', failed.message);
      return { status: 'error' };
    }
    const p = profileRes.data;
    const dogRows = dogsRes.data;

    // A profile row exists for every confirmed signup (trigger), but treat a
    // never-onboarded profile (no name yet) as absent so onboarding runs.
    const owner: OwnerProfile | null =
      p && p.first_name
        ? {
            id: p.id,
            firstName: p.first_name,
            area: p.area,
            bio: p.bio,
            ageRange: p.age_range ?? undefined,
            languages: p.languages ?? [],
            availability: p.availability ?? [],
            verified: false,
            photo: p.photo_url ?? undefined,
            petStatus: p.pet_status,
            otherPetType: p.other_pet_type ?? undefined,
            showProfileToMatches: p.show_profile_to_matches,
            lat: p.lat ?? undefined,
            lon: p.lon ?? undefined,
            availableToMeet: p.available_to_meet ?? false,
            meetNote: p.meet_note ?? undefined,
          }
        : null;

    const dogs: DogProfile[] = (dogRows ?? []).map((d) => ({
      id: d.id,
      ownerId: d.owner_id,
      ownerName: owner?.firstName ?? '',
      ownerArea: owner?.area ?? '',
      ownerVerified: false,
      name: d.name,
      photos: d.photos ?? [],
      intents: d.intents ?? [],
      breed: d.breed,
      ageYears: d.age_years,
      sex: d.sex,
      size: d.size,
      weightKg: Number(d.weight_kg ?? 0),
      energy: d.energy,
      social: d.social,
      personality: d.personality ?? [],
      playStyle: d.play_style ?? [],
      favourite: d.favourite ?? [],
      vaccinated: d.vaccinated,
      neutered: d.neutered,
      goodWith: d.good_with ?? {},
      recall: d.recall,
      meetupPref: d.meetup_pref,
      notes: d.notes ?? undefined,
      avoid: d.avoid ?? undefined,
      distanceKm: 0,
    }));

    return { status: 'ok', owner, dogs };
  } catch (e) {
    console.warn('[sync] fetchRemoteState failed:', e);
    return { status: 'error' };
  }
}

/**
 * `fetchRemoteState`, retried once after a forced token refresh. A restored
 * session can hold an access token the server already rejects (say, a tab
 * that woke from sleep before its background refresh ran), so the first read
 * fails with 401 although the account is fine.
 */
export async function loadRemoteState(): Promise<RemoteState> {
  const first = await fetchRemoteState();
  if (first.status !== 'error') return first;
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn('[sync] session refresh failed:', error.message);
      return first;
    }
  } catch (e) {
    console.warn('[sync] session refresh failed:', e);
    return first;
  }
  return fetchRemoteState();
}
