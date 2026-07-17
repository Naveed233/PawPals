import { SEED_DOGS } from '@/data/seed';
import { useStore } from '@/store';
import type { DogProfile } from '@/types';

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
