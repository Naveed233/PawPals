import { isRealPhoto } from '@/lib/avatars';
import { DOG_IMAGES } from '@/lib/seedImages';
import type { DisplayPhoto, DogProfile } from '@/types';

/**
 * Photos to display for a dog, in priority order:
 *   1. the user's own uploaded photos (picker uris)
 *   2. the bundled real seed photo (for demo dogs)
 *   3. procedural placeholder slots (so every profile has a likeable gallery)
 */
export function displayPhotos(dog: DogProfile, minSlots = 3): DisplayPhoto[] {
  const slots: DisplayPhoto[] = [];

  (dog.photos ?? [])
    .filter(isRealPhoto)
    .forEach((uri, i) => slots.push({ key: `${dog.id}:real:${i}`, uri }));

  const bundled = DOG_IMAGES[dog.id];
  if (bundled != null) slots.push({ key: `${dog.id}:seed`, module: bundled });

  let i = 0;
  while (slots.length < minSlots) {
    slots.push({ key: `${dog.id}:slot:${i}` });
    i++;
  }
  return slots;
}

export function heroPhoto(dog: DogProfile): DisplayPhoto {
  return displayPhotos(dog, 1)[0];
}
