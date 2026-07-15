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
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[sync] saveProfile failed:', error.message);
  } catch (e) {
    console.warn('[sync] saveProfile failed:', e);
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
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[sync] saveDog failed:', error.message);
  } catch (e) {
    console.warn('[sync] saveDog failed:', e);
  }
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

/** The user's own data as stored server-side (null when none / unavailable). */
export async function fetchRemoteState(): Promise<{
  owner: OwnerProfile | null;
  dogs: DogProfile[];
} | null> {
  try {
    const id = await userId();
    if (!id) return null;

    const [{ data: p }, { data: dogRows }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('dogs').select('*').eq('owner_id', id),
    ]);

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

    return { owner, dogs };
  } catch (e) {
    console.warn('[sync] fetchRemoteState failed:', e);
    return null;
  }
}
