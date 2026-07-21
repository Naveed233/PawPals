import { fetchRemoteMatches } from '@/lib/remote';
import { useStore } from '@/store';

/**
 * After liking a real user's dog, the DB trigger decides if it's a mutual
 * match. Poll for it, merge any new match into the store, and return the
 * matched dog id (for the celebration) or null. Used by both the discovery
 * deck and the dog-profile "like" button so they behave identically.
 */
export async function detectRealMatch(ownerId: string): Promise<string | null> {
  const matches = await fetchRemoteMatches();
  const hit = matches.find((m) => m.otherOwnerId === ownerId);
  if (!hit) return null;
  useStore.getState().mergeRemoteMatches(
    [
      {
        id: hit.matchId,
        dogId: hit.dog?.id ?? hit.matchId,
        createdAt: hit.createdAt,
        matchId: hit.matchId,
        otherOwnerId: hit.otherOwnerId,
      },
    ],
    hit.dog ? [hit.dog] : [],
  );
  return hit.dog?.id ?? hit.matchId;
}
