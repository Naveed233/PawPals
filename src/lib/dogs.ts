import { SEED_DOGS } from '@/data/seed';
import { useStore } from '@/store';
import type { DiscoveryFilters, DogProfile, GoodWith } from '@/types';

/**
 * Resolve a dog by id across all sources: demo seed dogs, the current user's
 * own dogs, and real dogs fetched from other users (remoteDogs in the store).
 * Screens use this instead of SEED_DOGS.find so real user dogs render too.
 */
export function dogById(id: string | undefined): DogProfile | undefined {
  if (!id) return undefined;
  const seed = SEED_DOGS.find((d) => d.id === id);
  if (seed) return seed;
  const { dogs, remoteDogs } = useStore.getState();
  return dogs.find((d) => d.id === id) ?? remoteDogs.find((d) => d.id === id);
}

/** True when the id belongs to a demo seed dog (no real owner to chat with). */
export function isSeedDog(id: string): boolean {
  return SEED_DOGS.some((d) => d.id === id);
}

/** Does a dog satisfy the active discovery filters? */
export function matchesFilters(dog: DogProfile, f: DiscoveryFilters): boolean {
  if (f.sizes.length && !f.sizes.includes(dog.size)) return false;
  if (f.energies.length && !f.energies.includes(dog.energy)) return false;
  if (f.sexes.length && !f.sexes.includes(dog.sex)) return false;
  if (f.maxDistanceKm != null && dog.distanceKm > f.maxDistanceKm) return false;
  if (f.vaccinatedOnly && !dog.vaccinated) return false;
  if (f.neuteredOnly && !dog.neutered) return false;
  if (f.goodWith.length && !f.goodWith.every((k) => dog.goodWith[k as keyof GoodWith])) return false;
  if (f.breed.trim() && !dog.breed.toLowerCase().includes(f.breed.trim().toLowerCase())) return false;
  return true;
}

/** How many of the 8 filter dimensions are currently active. */
export function activeFilterCount(f: DiscoveryFilters): number {
  return (
    (f.sizes.length ? 1 : 0) +
    (f.energies.length ? 1 : 0) +
    (f.sexes.length ? 1 : 0) +
    (f.maxDistanceKm != null ? 1 : 0) +
    (f.vaccinatedOnly ? 1 : 0) +
    (f.neuteredOnly ? 1 : 0) +
    (f.goodWith.length ? 1 : 0) +
    (f.breed.trim() ? 1 : 0)
  );
}

/**
 * Dogs that have "liked you" — the data behind the Premium "Who liked you"
 * screen. Seed dogs flagged likesYou populate the demo; real likes on the
 * user's own dogs come from remote.fetchWhoLikedMe() and are merged in by the
 * screen. Seed entries never produce a match (they're showcase only).
 */
export function seedLikedYou(): DogProfile[] {
  return SEED_DOGS.filter((d) => d.likesYou);
}
