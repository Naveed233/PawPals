import { eventPalette, type EventCategory } from '@/theme';
import type { MeetupType } from '@/types';

/**
 * Group the meetup types into four colour-coded categories, each with an emoji:
 *   walk 🐕 green · café ☕ brown · park 🌳 blue · playdate 🎾 orange
 */
const CATEGORY: Record<MeetupType, EventCategory> = {
  'Group walk': 'walk',
  'Leash walk': 'walk',
  'Senior dog meetup': 'walk',
  'Dog park visit': 'park',
  'Café meetup': 'cafe',
  'One-on-one playdate': 'playdate',
  'Puppy socialisation': 'playdate',
  'Short introduction': 'playdate',
};

export function eventCategory(type: MeetupType): EventCategory {
  return CATEGORY[type] ?? 'walk';
}

/** Colour, soft background, emoji + category for a meetup type. */
export function eventStyle(type: MeetupType) {
  const category = eventCategory(type);
  return { category, ...eventPalette[category] };
}
