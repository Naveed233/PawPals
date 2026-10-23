/**
 * PawPair design tokens. Keep every colour, spacing, radius and type value here
 * so screens stay consistent and a theme change is a single edit.
 */

/**
 * The world: a cheki (instant-photo) album on a clear day. Dogs sit on white
 * "prints" over a sky-tinted ground, all text is marker-navy ink, cobalt carries
 * every action, and sunflower is kept for reward moments only.
 *
 * Roles (use these, not raw hex, in screens):
 *  - action     cobalt FILL: primary buttons, the like circle, active tab, chips on
 *  - onAction   text/icons ON an action fill
 *  - accentInk  the action colour for text, icons and outlines (cobalt is text-safe)
 *  - reward     sunflower FILL for delight only: compatibility sticker, match paw
 *  - onReward   text/icons ON a reward fill (never put reward-coloured text on light)
 *  - ink / inkMuted / inkFaint  text; every one passes 4.5:1 on ground, print and input
 *  - mint / lilac / blossom / butter / skyTint  category chips, each with its *Ink
 *
 * Chosen by measurement over sunny-only and park-green variants: see
 * .impeccable/surfaces/src-app.md and DESIGN.md.
 */
const P = {
  ground: '#E7F0FA',
  groundTop: '#F3F8FD',
  input: '#F2F6FB',
  action: '#3552D9',
  onAction: '#FFFFFF',
  actionSoft: '#E1E6FB',
  accentInk: '#3552D9',
  reward: '#FFC53D',
  onReward: '#1B2340',
};

/** Ink, prints, states and pastel category tints. */
export const tone = {
  ...P,
  print: '#FFFFFF',
  printEdge: '#DCE3EE',
  ink: '#1B2340',
  inkMuted: '#4B5670',
  inkFaint: '#5A6480',
  success: '#1E7A4C',
  successSoft: '#DDF0E4',
  danger: '#BA3329',
  dangerSoft: '#FBE4E1',
  mint: '#D5EFE0',
  mintInk: '#1D5C3E',
  lilac: '#E3DDF6',
  lilacInk: '#4A3A8C',
  blossom: '#F9DCE2',
  blossomInk: '#8C2F45',
  butter: '#FCEBB6',
  butterInk: '#6E5100',
  skyTint: '#D3E5F7',
  skyInk: '#1F4E85',
  /** The album page behind the match prints: the sky ground, nearly opaque. */
  skyScrim: 'rgba(231,240,250,0.97)',
  shadow: '#1B2340',
} as const;

/** Legacy names kept so existing call sites compile; values follow the roles. */
export const brand = {
  coral: tone.action,
  coralDeep: tone.accentInk,
  coralSoft: tone.actionSoft,
  forest: tone.success,
  forestDeep: tone.success,
  forestSoft: tone.successSoft,
  golden: tone.butter,
  goldenSoft: tone.butter,
  bg: tone.ground,
  card: tone.print,
  text: tone.ink,
  muted: tone.inkMuted,
  faint: tone.inkFaint,
  border: tone.printEdge,
} as const;

/** Event-type category tints (walk/café/park/playdate): ink text on a pastel. */
export const eventPalette = {
  walk: { color: tone.mintInk, soft: tone.mint, emoji: '🐕' },
  cafe: { color: tone.butterInk, soft: tone.butter, emoji: '☕' },
  park: { color: tone.skyInk, soft: tone.skyTint, emoji: '🌳' },
  playdate: { color: tone.blossomInk, soft: tone.blossom, emoji: '🎾' },
} as const;
export type EventCategory = keyof typeof eventPalette;

export const colors = {
  cream: tone.ground,
  surface: tone.print,
  surfaceAlt: tone.input,

  forest: tone.success,
  forestDark: tone.success,
  forestSoft: tone.successSoft,

  coral: tone.action,
  coralSoft: tone.actionSoft,

  blue: tone.skyInk,
  blueSoft: tone.skyTint,

  charcoal: tone.ink,
  ink: tone.ink,
  muted: tone.inkMuted,
  faint: tone.inkFaint,

  border: tone.printEdge,
  success: tone.success,
  warning: tone.butter,
  danger: tone.danger,

  overlayLike: 'rgba(27,35,64,0.72)',
  overlayPass: 'rgba(27,35,64,0.72)',

  sunrise: [tone.groundTop, tone.ground, tone.skyTint],
} as const;

/**
 * Main app theme. The namespace is still `night` for historical reasons (it was
 * once a dark theme). `pink` / `coral` = the action FILL; use `accentInk` for
 * text and icons in that colour.
 */
export const night = {
  bg: tone.ground,
  bgTop: tone.groundTop,
  card: tone.print,
  surface: tone.print,
  surfaceHi: tone.input,
  border: tone.printEdge,
  input: tone.input,
  text: tone.ink,
  muted: tone.inkMuted,
  faint: tone.inkFaint,

  pink: tone.action,
  pinkDeep: tone.accentInk,
  pinkSoft: tone.actionSoft,

  coral: tone.action,
  coralDeep: tone.accentInk,
  coralSoft: tone.actionSoft,
  onAction: tone.onAction,
  accentInk: tone.accentInk,
  forest: tone.success,
  forestDeep: tone.success,
  golden: tone.butter,
  goldenSoft: tone.butter,
  softGreen: tone.mint,
  softGreenText: tone.mintInk,

  navy: tone.skyTint, // map fallback background
  navyLine: tone.printEdge,
  success: tone.success,
  danger: tone.danger,
  tabBar: tone.print,
} as const;

/** Dog profile page (dog/[id]) palette, in the same world. */
export const pastel = {
  hero: tone.skyTint,
  sheet: tone.print,
  lavender: tone.lilac,
  lavenderText: tone.lilacInk,
  butter: tone.butter,
  butterText: tone.butterInk,
  mint: tone.mint,
  mintText: tone.mintInk,
  ink: tone.ink,
  mutedInk: tone.inkMuted,
  orange: tone.accentInk,
  dashed: tone.printEdge,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  /** An instant-photo print: nearly square corners. */
  print: 6,
  pill: 999,
} as const;

export const font = {
  // Sizes
  display: 30,
  title: 22,
  heading: 18,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export const shadow = {
  card: {
    shadowColor: tone.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  soft: {
    shadowColor: tone.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  /** A print lying on the table: a little lift, a soft fall-off. */
  print: {
    shadowColor: tone.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
