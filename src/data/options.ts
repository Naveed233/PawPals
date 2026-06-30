import type { Energy, Intent, MeetupType, Sex, Size, SocialLevel } from '@/types';

/** Selectable option sets, kept in one place so forms and filters agree. */

export const SIZES: Size[] = ['small', 'medium', 'large'];
export const SEXES: Sex[] = ['male', 'female'];
export const ENERGY_LEVELS: Energy[] = ['low', 'moderate', 'high'];
export const SOCIAL_LEVELS: SocialLevel[] = ['shy', 'selective', 'social', 'very social'];

export const PERSONALITY_TAGS: string[] = [
  'Playful',
  'Calm',
  'Shy',
  'Confident',
  'Energetic',
  'Gentle',
  'Curious',
  'Independent',
  'Social',
  'Selective',
  'Puppy-friendly',
  'Senior-friendly',
];

export const PLAY_STYLE_TAGS: string[] = [
  'Chasing',
  'Wrestling',
  'Gentle play',
  'Parallel walking',
  'Fetch',
  'Sniffing',
  'Short introductions',
  'One-on-one play',
  'Group play',
];

export const ACTIVITY_TAGS: string[] = [
  'Morning walks',
  'Park visits',
  'Beach trips',
  'Hiking',
  'Café hangouts',
  'Training sessions',
  'Backyard play',
];

export const INTENTS: Intent[] = [
  'Dog playdates',
  'Walking buddies',
  'Meetups & hangouts',
  'Group events',
  'Owner dating',
];

export const MEETUP_TYPES: MeetupType[] = [
  'Short introduction',
  'Leash walk',
  'Dog park visit',
  'One-on-one playdate',
  'Group walk',
  'Puppy socialisation',
  'Senior dog meetup',
  'Café meetup',
];

export const LANGUAGES: string[] = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Urdu'];

export const AVAILABILITY: string[] = [
  'Weekday mornings',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
];

export const AGE_RANGES: string[] = ['18-24', '25-34', '35-44', '45-54', '55+'];
