import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_DOGS, SEED_PHOTO_LIKES } from '@/data/seed';
import {
  EMPTY_FILTERS,
  type Conversations,
  type DiscoveryFilters,
  type DogProfile,
  type Match,
  type Message,
  type OwnerProfile,
  type PawEvent,
  type SwipeDirection,
  type SwipeRecord,
} from '@/types';

let msgCounter = 0;
const newMessageId = (dogId: string) => `m-${dogId}-${Date.now()}-${msgCounter++}`;

/**
 * App state for the MVP slice, persisted to AsyncStorage so the demo survives
 * reloads. Auth is mocked (email only); the "other owner liked you" side of a
 * match is mocked via each seed dog's `likesYou` flag.
 */

interface AppState {
  _hasHydrated: boolean;

  /** UI language — a device preference, so it survives sign-out. */
  language: 'ja' | 'en';

  session: { email: string } | null;
  owner: OwnerProfile | null;
  dogs: DogProfile[];

  // Real dogs from other users (Phase 2), merged into discovery + resolvers.
  remoteDogs: DogProfile[];

  // Discovery filters (Premium features are free but badged in the UI).
  filters: DiscoveryFilters;

  deck: string[] | null; // remaining seed dog ids; null = not yet initialised
  swipes: SwipeRecord[]; // history, oldest first
  saved: string[];
  matches: Match[];

  // Anonymous photo likes: aggregate counts + the keys *this* user liked (so
  // we can toggle). We never associate a like with an identity for others.
  photoLikes: Record<string, number>;
  likedPhotos: string[];

  // Chat: messages keyed by the matched dog's id.
  conversations: Conversations;

  // Events: list (null = not yet seeded) + which ones I've RSVP'd "going".
  events: PawEvent[] | null;
  rsvps: Record<string, boolean>;

  setHasHydrated: (v: boolean) => void;
  setLanguage: (language: 'ja' | 'en') => void;
  signIn: (email: string) => void;
  signOut: () => void;
  setOwner: (owner: OwnerProfile) => void;
  updateOwner: (patch: Partial<OwnerProfile>) => void;
  addDog: (dog: DogProfile) => void;
  updateDog: (dogId: string, patch: Partial<DogProfile>) => void;
  addDogPhoto: (dogId: string, uri: string) => void;

  setRemoteDogs: (dogs: DogProfile[]) => void;
  /** Merge real matches (from the DB) into local matches + resolvable dogs. */
  mergeRemoteMatches: (matches: Match[], dogs: DogProfile[]) => void;
  setFilters: (filters: DiscoveryFilters) => void;
  clearFilters: () => void;

  ensureDeck: () => void;
  swipe: (dogId: string, direction: SwipeDirection) => Match | null;
  undo: () => void;
  toggleSave: (dogId: string) => void;
  togglePhotoLike: (key: string) => void;

  sendText: (dogId: string, text: string) => void;
  sendImageMessage: (dogId: string, uri: string) => void;
  receiveReply: (dogId: string, text: string) => void;

  ensureEvents: () => void;
  rsvp: (eventId: string, going: boolean) => void;
  createEvent: (event: Omit<PawEvent, 'id'>) => string;

  resetDemo: () => void;
}

const seedDeckIds = () => SEED_DOGS.map((d) => d.id);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,

      language: 'ja' as const,

      session: null,
      owner: null,
      dogs: [],
      remoteDogs: [],
      filters: { ...EMPTY_FILTERS },

      deck: null,
      swipes: [],
      saved: [],
      matches: [],

      photoLikes: { ...SEED_PHOTO_LIKES },
      likedPhotos: [],

      conversations: {},

      events: null,
      rsvps: {},

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setLanguage: (language) => set({ language }),

      signIn: (email) => set({ session: { email: email.trim().toLowerCase() } }),

      signOut: () =>
        set({
          session: null,
          owner: null,
          dogs: [],
          remoteDogs: [],
          filters: { ...EMPTY_FILTERS },
          deck: null,
          swipes: [],
          saved: [],
          matches: [],
          photoLikes: { ...SEED_PHOTO_LIKES },
          likedPhotos: [],
          conversations: {},
          events: null,
          rsvps: {},
        }),

      setOwner: (owner) => set({ owner }),

      updateOwner: (patch) => {
        const owner = get().owner;
        if (owner) set({ owner: { ...owner, ...patch } });
      },

      addDog: (dog) => set({ dogs: [...get().dogs, dog] }),

      updateDog: (dogId, patch) =>
        set({ dogs: get().dogs.map((d) => (d.id === dogId ? { ...d, ...patch } : d)) }),

      addDogPhoto: (dogId, uri) =>
        set({
          dogs: get().dogs.map((d) =>
            d.id === dogId ? { ...d, photos: [...d.photos, uri] } : d,
          ),
        }),

      setRemoteDogs: (remoteDogs) => set({ remoteDogs }),

      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: { ...EMPTY_FILTERS } }),

      mergeRemoteMatches: (incoming, dogs) => {
        const state = get();
        // Add any newly-seen real dogs so they resolve in chat/matches.
        const known = new Set(state.remoteDogs.map((d) => d.id));
        const addedDogs = dogs.filter((d) => !known.has(d.id));
        // Dedupe matches by DB matchId (fall back to dogId).
        const seen = new Set(state.matches.map((m) => m.matchId ?? m.dogId));
        const fresh = incoming.filter((m) => !seen.has(m.matchId ?? m.dogId));
        if (addedDogs.length === 0 && fresh.length === 0) return;
        set({
          remoteDogs: [...state.remoteDogs, ...addedDogs],
          matches: [...fresh, ...state.matches],
        });
      },

      ensureDeck: () => {
        if (get().deck === null) set({ deck: seedDeckIds() });
      },

      swipe: (dogId, direction) => {
        const state = get();
        const deck = (state.deck ?? seedDeckIds()).filter((id) => id !== dogId);
        const record: SwipeRecord = { dogId, direction, at: Date.now() };

        // Seed/showcase dogs are demo profiles that populate discovery but
        // never match — only real users match, via the DB trigger (surfaced
        // by the discover screen). So swiping a seed dog never creates a match.
        set({
          deck,
          swipes: [...state.swipes, record],
        });
        return null;
      },

      undo: () => {
        const state = get();
        if (state.swipes.length === 0) return;
        const last = state.swipes[state.swipes.length - 1];
        const deck = state.deck ?? seedDeckIds();
        set({
          swipes: state.swipes.slice(0, -1),
          deck: [last.dogId, ...deck.filter((id) => id !== last.dogId)],
          // remove a match that this swipe created, if any
          matches: state.matches.filter((m) => m.dogId !== last.dogId),
        });
      },

      toggleSave: (dogId) => {
        const saved = get().saved;
        set({
          saved: saved.includes(dogId) ? saved.filter((id) => id !== dogId) : [...saved, dogId],
        });
      },

      togglePhotoLike: (key) => {
        const { likedPhotos, photoLikes } = get();
        const liked = likedPhotos.includes(key);
        const base = photoLikes[key] ?? 0;
        set({
          likedPhotos: liked ? likedPhotos.filter((k) => k !== key) : [...likedPhotos, key],
          photoLikes: { ...photoLikes, [key]: Math.max(0, base + (liked ? -1 : 1)) },
        });
      },

      sendText: (dogId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const msg: Message = { id: newMessageId(dogId), sender: 'me', kind: 'text', text: trimmed, at: Date.now() };
        const convs = get().conversations;
        set({ conversations: { ...convs, [dogId]: [...(convs[dogId] ?? []), msg] } });
      },

      sendImageMessage: (dogId, uri) => {
        const msg: Message = { id: newMessageId(dogId), sender: 'me', kind: 'image', uri, at: Date.now() };
        const convs = get().conversations;
        set({ conversations: { ...convs, [dogId]: [...(convs[dogId] ?? []), msg] } });
      },

      receiveReply: (dogId, text) => {
        const msg: Message = { id: newMessageId(dogId), sender: 'them', kind: 'text', text, at: Date.now() };
        const convs = get().conversations;
        set({ conversations: { ...convs, [dogId]: [...(convs[dogId] ?? []), msg] } });
      },

      ensureEvents: () => {
        // Real events only — no demo/seed events. Starts empty; fills as users
        // (including you) host meetups.
        if (get().events === null) set({ events: [] });
      },

      rsvp: (eventId, going) => set({ rsvps: { ...get().rsvps, [eventId]: going } }),

      createEvent: (event) => {
        const id = `evt-mine-${Date.now()}`;
        const created: PawEvent = { ...event, id };
        const events = get().events ?? [];
        set({ events: [created, ...events], rsvps: { ...get().rsvps, [id]: true } });
        return id;
      },

      resetDemo: () =>
        set({
          deck: seedDeckIds(),
          swipes: [],
          saved: [],
          matches: [],
          photoLikes: { ...SEED_PHOTO_LIKES },
          likedPhotos: [],
          conversations: {},
          events: null,
          rsvps: {},
        }),
    }),
    {
      name: 'pawpair-store-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ _hasHydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      // v2: drop the old demo/seed events so returning users see only real,
      // user-hosted meetups. User-hosted events use 'evt-mine-' ids.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { events?: PawEvent[] | null; rsvps?: Record<string, boolean> };
        if (version < 2 && state && Array.isArray(state.events)) {
          const kept = state.events.filter((e) => e.id?.startsWith('evt-mine-'));
          const keptIds = new Set(kept.map((e) => e.id));
          const rsvps = Object.fromEntries(
            Object.entries(state.rsvps ?? {}).filter(([id]) => keptIds.has(id)),
          );
          return { ...state, events: kept, rsvps };
        }
        return state;
      },
    },
  ),
);
