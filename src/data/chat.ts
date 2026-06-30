/** Canned chat content for the demo. */

export const SUGGESTED_OPENERS = [
  'Would you like to meet for a short walk?',
  'What kind of play does your dog enjoy?',
  'Would your dog be comfortable meeting in a quiet area?',
  'Are you available this weekend?',
  'Would you prefer a walk before off-leash play?',
];

/**
 * Simulated replies from the matched owner. There is no real person on the
 * other end — these make the demo conversation feel alive. Chosen in rotation.
 */
export const CANNED_REPLIES = [
  'That sounds lovely! 🐾',
  'Yes, this weekend works well for us.',
  'Mine loves a good sniff-walk — where do you usually go?',
  'A quiet area to start sounds perfect.',
  "Let's do a short intro first and see how they get on.",
  'Aww, would love to set up a playdate!',
  'How about Saturday morning at the park?',
  'My pup is friendly but a little shy at first 😊',
];

export function replyFor(messageCount: number): string {
  return CANNED_REPLIES[messageCount % CANNED_REPLIES.length];
}
