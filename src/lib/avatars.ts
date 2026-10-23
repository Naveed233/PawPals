/**
 * Deterministic procedural avatars.
 *
 * AI image generation is unavailable here (no Hugging Face token) and scraping
 * stock sites is unreliable + licence-murky, so demo profiles use generated
 * gradient + emoji avatars instead. They are offline-safe (no broken remote
 * images) and deterministic per id, so a given dog/owner always looks the same.
 *
 * Real photos added via the image picker take precedence over these.
 */

export type Gradient = readonly [string, string];

const GRADIENTS: Gradient[] = [
  ['#A7D8C9', '#2E5E4E'],
  ['#F7C9BC', '#F2765E'],
  ['#BFD8EE', '#6FA8DC'],
  ['#F3E2B3', '#E0A33B'],
  ['#D9C8E8', '#9B7BC4'],
  ['#F8C8D8', '#E86A92'],
  ['#C9E4CA', '#5BA66E'],
  ['#FAD7A0', '#E59866'],
  ['#BFE3E0', '#3E9E97'],
  ['#E6C9A8', '#B07D4F'],
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
