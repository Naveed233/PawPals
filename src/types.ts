/** Domain models for the PawPair MVP slice. */

export type Sex = 'male' | 'female';
export type Size = 'small' | 'medium' | 'large';
export type Energy = 'low' | 'moderate' | 'high';
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
  dateLabel: string; // e.g. "Sat 4 Jul"
  timeLabel: string; // e.g. "10:00 AM"
  description: string;
  attendeeCount: number; // others already going (you are tracked separately)
}
