/** Domain models for the PawPair MVP slice. */

export type Sex = 'male' | 'female';
export type Size = 'small' | 'medium' | 'large';
export type Energy = 'low' | 'moderate' | 'high';

/**
 * Discovery filters. Everything is free today; the "advanced" ones are just
 * badged Premium in the UI so monetization can switch on later without a
 * rebuild. Empty array / null / false means "no constraint".
 */
export interface DiscoveryFilters {
  sizes: Size[];
  energies: Energy[];
  sexes: Sex[];
  maxDistanceKm: number | null;
  vaccinatedOnly: boolean;
  neuteredOnly: boolean;
  goodWith: string[]; // keys of GoodWith the dog must satisfy
  breed: string; // case-insensitive "contains" match
}

export const EMPTY_FILTERS: DiscoveryFilters = {
  sizes: [],
  energies: [],
  sexes: [],
  maxDistanceKm: null,
  vaccinatedOnly: false,
  neuteredOnly: false,
  goodWith: [],
  breed: '',
};
export type SocialLevel = 'shy' | 'selective' | 'social' | 'very social';
export type Recall = 'reliable' | 'improving' | 'on-leash only';

export type MeetupType =
  | 'Short introduction'
  | 'Leash walk'
  | 'Dog park visit'
  | 'One-on-one playdate'
  | 'Group walk'
  | 'Puppy socialisation'
  | 'Senior dog meetup'
  | 'Café meetup';

export interface GoodWith {
  smallDogs: boolean;
  largeDogs: boolean;
  puppies: boolean;
  seniors: boolean;
  children: boolean;
}

/** A photo to display: a real image (uri or bundled module) or a placeholder. */
export interface DisplayPhoto {
  key: string;
  uri?: string;
  module?: number; // a require()'d bundled asset (seed photos)
}

/** What an owner is here for — PawPair is dates *and* meetups/hangouts/events. */
export type Intent =
  | 'Dog playdates'
  | 'Walking buddies'
  | 'Meetups & hangouts'
  | 'Group events'
  | 'Owner dating';

/**
 * Whether the owner has a dog (full pet-profile flow), another pet, or no pet.
 * Optional on persisted profiles from older builds — treat missing as 'has-dog'.
 */
export type PetStatus = 'has-dog' | 'has-other-pet' | 'no-pet-meet' | 'no-pet-future';

export interface OwnerProfile {
  id: string;
  firstName: string;
  ageRange?: string;
  bio: string;
  area: string; // general area, never an exact address
  languages: string[];
  availability: string[];
  verified: boolean;
  photo?: string; // owner's own photo uri (from picker)
  petStatus?: PetStatus;
  otherPetType?: string; // when petStatus === 'has-other-pet' (user-entered, ≤30 chars)
  /** Show my owner profile to people I've matched with (default true). */
  showProfileToMatches?: boolean;
  /** Approximate location for map/distance (rounded; never an exact address). */
  lat?: number;
  lon?: number;
  /** Boost expiry (ms epoch) — while active you surface higher to others. */
  boostedUntil?: number;
  /** Opt-in: show me on the map as free to meet (off by default). */
  availableToMeet?: boolean;
  /** Short free-text availability, e.g. "Weekends, mornings" (≤60 chars). */
  meetNote?: string;
}

export interface DogProfile {
  id: string;
  ownerId: string;
  // Denormalised owner preview shown beneath the dog (owner is supporting info).
  ownerName: string;
  ownerArea: string;
  ownerVerified: boolean;

  name: string;
  photos: string[]; // real photo uris (picker/remote); empty -> procedural avatar
  intents: Intent[]; // what this owner is looking for
  breed: string;
  ageYears: number;
  sex: Sex;
  size: Size;
  weightKg: number;
  energy: Energy;
  social: SocialLevel;

  personality: string[];
  playStyle: string[];
  favourite: string[];

  vaccinated: boolean;
  neutered: boolean;
  goodWith: GoodWith;
  recall: Recall;
  meetupPref: MeetupType;

  notes?: string;
  avoid?: string;

  /** Distance from the current user, km. Approximate by design. */
  distanceKm: number;
  /**
   * MOCK ONLY: in a real backend this is computed from the other owner's swipe.
   * Here it seeds whether a right-swipe produces a mutual match for the demo.
   */
  likesYou?: boolean;
}

export type SwipeDirection = 'like' | 'pass';

export interface SwipeRecord {
  dogId: string;
  direction: SwipeDirection;
  at: number;
}

export interface Match {
  id: string;
  dogId: string; // the matched dog (matches reference a specific dog profile)
  createdAt: number;
  /** DB match row id — present for real user matches; enables realtime chat. */
  matchId?: string;
  /** The other owner's profile id — present for real user matches. */
  otherOwnerId?: string;
}

export type MessageKind = 'text' | 'image';

export interface Message {
  id: string;
  sender: 'me' | 'them';
  kind: MessageKind;
  text?: string;
  uri?: string; // for image messages
  at: number;
}

/** Conversations are keyed by the matched dog's id. */
export type Conversations = Record<string, Message[]>;

/** A meetup / hangout / event that owners can host and RSVP to. */
export interface PawEvent {
  id: string;
  title: string;
  type: MeetupType;
  hostOwnerId: string;
  hostName: string;
  locationName: string; // suggested public place
  area: string; // general area
  dateLabel: string; // display, e.g. "Sat 4 Jul" (derived from startsAt)
  timeLabel: string; // display, e.g. "10:00 AM" (derived from startsAt)
  description: string;
  attendeeCount: number; // others already going (you are tracked separately)
  startsAt?: string; // ISO datetime — the real start, used for phone reminders
  lat?: number; // approximate meeting-spot location (never an exact address)
  lon?: number;
}
