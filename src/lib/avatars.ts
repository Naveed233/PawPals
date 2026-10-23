/**
 * Deterministic procedural avatars.
 *
 * AI image generation is unavailable here (no Hugging Face token) and scraping
 * stock sites is unreliable + licence-murky, so demo profiles use generated
 * pastel gradient + glyph avatars instead. They are offline-safe (no broken remote
 * images) and deterministic per id, so a given dog/owner always looks the same.
 *
 * Real photos added via the image picker take precedence over these.
 */

export type Gradient = readonly [string, string];

// Soft pastel pairs from the app's category tints; avatars draw ink glyphs on them.
const GRADIENTS: Gradient[] = [
  ['#D5EFE0', '#AEDCC2'],
  ['#E3DDF6', '#C7BDEE'],
  ['#F9DCE2', '#F1BDC8'],
  ['#FCEBB6', '#F6D886'],
  ['#D3E5F7', '#AFCDEE'],
  ['#E6EEF8', '#C6D6EA'],
  ['#DDF0E4', '#B9E0C9'],
  ['#EFE6F9', '#D6C7F0'],
];

const DOG_EMOJI = ['🐕', '🐶', '🦮', '🐩', '🐕‍🦺', '🐾', '🐺'];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function gradientFor(seed: string): Gradient {
  return GRADIENTS[hash(seed) % GRADIENTS.length];
}

export function dogEmojiFor(seed: string): string {
  return DOG_EMOJI[hash(seed + '·dog') % DOG_EMOJI.length];
}

/** True when a photo string is a real image (picker / remote) vs a placeholder token. */
export function isRealPhoto(value?: string): boolean {
  if (!value) return false;
  return (
    value.startsWith('file:') ||
    value.startsWith('http') ||
    value.startsWith('data:') ||
    value.startsWith('content:') ||
    value.startsWith('blob:') ||
    value.startsWith('ph://')
  );
}
