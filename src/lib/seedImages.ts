/**
 * Bundled real photos for the demo profiles.
 *
 * Dog photos: real, breed-matched images from the dog.ceo API (Stanford Dogs).
 * Owner photos: free portrait photos from randomuser.me.
 * Both are downloaded into assets/ so they're bundled and work offline (no
 * broken remote images). Real users' own uploads (via the picker) take
 * precedence over these.
 *
 * `require()` returns a Metro asset module id (number) usable as an expo-image
 * source. Keys are the seed dog / owner ids.
 */

export const DOG_IMAGES: Record<string, number> = {
  'dog-luna': require('../../assets/images/dogs/dog-luna.jpg'),
  'dog-cooper': require('../../assets/images/dogs/dog-cooper.jpg'),
  'dog-mochi': require('../../assets/images/dogs/dog-mochi.jpg'),
  'dog-bruno': require('../../assets/images/dogs/dog-bruno.jpg'),
  'dog-daisy': require('../../assets/images/dogs/dog-daisy.jpg'),
  'dog-rocky': require('../../assets/images/dogs/dog-rocky.jpg'),
  'dog-nala': require('../../assets/images/dogs/dog-nala.jpg'),
  'dog-pepper': require('../../assets/images/dogs/dog-pepper.jpg'),
  'dog-max': require('../../assets/images/dogs/dog-max.jpg'),
  'dog-bella': require('../../assets/images/dogs/dog-bella.jpg'),
  'dog-zeus': require('../../assets/images/dogs/dog-zeus.jpg'),
  'dog-ollie': require('../../assets/images/dogs/dog-ollie.jpg'),
};

export const OWNER_IMAGES: Record<string, number> = {
  'owner-2': require('../../assets/images/people/owner-2.jpg'),
  'owner-3': require('../../assets/images/people/owner-3.jpg'),
  'owner-4': require('../../assets/images/people/owner-4.jpg'),
  'owner-5': require('../../assets/images/people/owner-5.jpg'),
  'owner-6': require('../../assets/images/people/owner-6.jpg'),
  'owner-7': require('../../assets/images/people/owner-7.jpg'),
  'owner-8': require('../../assets/images/people/owner-8.jpg'),
  'owner-9': require('../../assets/images/people/owner-9.jpg'),
  'owner-10': require('../../assets/images/people/owner-10.jpg'),
  'owner-11': require('../../assets/images/people/owner-11.jpg'),
  'owner-12': require('../../assets/images/people/owner-12.jpg'),
  'owner-13': require('../../assets/images/people/owner-13.jpg'),
};
