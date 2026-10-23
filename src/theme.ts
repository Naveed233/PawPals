/**
 * PawPair design tokens.
 *
 * Brand: warm, outdoorsy, trust-first — think Rover / AllTrails / Strava, NOT
 * a dating app. Parks, sunshine, happy dogs. Friendship & getting outside.
 *
 *  - Coral       #FF6B6B  primary / like / active
 *  - Forest      #3FAF6C  secondary / success / "outside"
 *  - Golden      #FFC857  accent / rewards
 *  - Warm white  #FFFDF8  background
 *  - White       #FFFFFF  cards
 *  - Charcoal    #2C2C2C  text
 *
 * Keep all colour / spacing / radius / typography here so screens stay
 * consistent and a theme change is a single edit.
 */

/** Brand palette — the single source of truth for the new identity. */
export const brand = {
  coral: '#FF6B6B',
  coralDeep: '#F25252',
  coralSoft: '#FFE9E6',
  forest: '#3FAF6C',
  forestDeep: '#2F9257',
  forestSoft: '#EAF8EE',
  golden: '#FFC857',
  goldenSoft: '#FFF3D6',
  bg: '#FFFDF8',
  card: '#FFFFFF',
  text: '#2C2C2C',
  muted: '#707070',
  faint: '#9A958C',
  border: '#ECE6DA',
} as const;

/** Event-type category colours (walk/café/park/playdate) + soft backgrounds. */
export const eventPalette = {
  walk: { color: '#3FAF6C', soft: '#EAF8EE', emoji: '🐕' },
  cafe: { color: '#A9703F', soft: '#F3E9DF', emoji: '☕' },
  park: { color: '#4C97C9', soft: '#E6F1F8', emoji: '🌳' },
  playdate: { color: '#F0913E', soft: '#FCEDDC', emoji: '🎾' },
} as const;
export type EventCategory = keyof typeof eventPalette;

export const colors = {
  cream: brand.bg,
  surface: '#FFFFFF',
  surfaceAlt: '#F4F1EA',

  forest: brand.forest,
  forestDark: brand.forestDeep,
  forestSoft: brand.forestSoft,

  coral: brand.coral,
  coralSoft: brand.coralSoft,

  blue: '#4C97C9',
  blueSoft: '#E6F1F8',

  charcoal: brand.text,
  ink: brand.text,
  muted: brand.muted,
  faint: brand.faint,

  border: brand.border,
  success: brand.forest,
  warning: brand.golden,
  danger: '#E5533D',

  overlayLike: 'rgba(63,175,108,0.88)',
  overlayPass: 'rgba(229,83,61,0.85)',

  // Welcome-screen hero gradient: sunny gold → tangerine → coral
  sunrise: ['#FFD86F', '#FFAE63', '#FF6B6B'],
} as const;

/**
 * Main app theme (discover, messages, map, onboarding, profile...).
 *
 * NOTE: the token namespace is still called `night` for historical reasons —
 * it used to be a dark theme — but the values below are the warm, LIGHT brand.
 * Renaming across every screen is deferred; the values here are the source of
 * truth. `pink` = the coral primary (kept as `pink` so existing call sites work).
 */
export const night = {
  bg: brand.bg, // warm white
  bgTop: '#FFF4E6', // soft sunny wash for screen tops
  card: brand.card,
  surface: '#FFFFFF',
  surfaceHi: '#F4F1EA',
  border: brand.border,
  input: '#F6F3EC',
  text: brand.text,
  muted: brand.muted,
  faint: brand.faint,

  // Primary brand colour (coral). Named `pink` for call-site compatibility.
  pink: brand.coral,
  pinkDeep: brand.coralDeep,
  pinkSoft: brand.coralSoft,

  // Semantic brand aliases (prefer these in new code)
  coral: brand.coral,
  coralDeep: brand.coralDeep,
  coralSoft: brand.coralSoft,
  forest: brand.forest,
  forestDeep: brand.forestDeep,
  golden: brand.golden,
  goldenSoft: brand.goldenSoft,
  softGreen: brand.forestSoft, // #EAF8EE pill background
  softGreenText: brand.forest, // #3FAF6C pill text

  navy: '#E7EEF1', // map fallback background (light)
  navyLine: '#CBD9DF',
  success: brand.forest,
  danger: '#E5533D',
  tabBar: '#FFFFFF', // white bottom nav
} as const;

/** Light pet-profile palette (dog/[id]) — aligned to the warm brand. */
export const pastel = {
  hero: '#F6D9C4',
  sheet: '#FFFFFF',
  lavender: '#E4EFE9',
  lavenderText: brand.forestDeep,
  butter: brand.goldenSoft,
  butterText: '#8A6A1E',
  mint: brand.forestSoft,
  mintText: brand.forestDeep,
  ink: brand.text,
  mutedInk: brand.muted,
  orange: brand.coral,
  dashed: '#E4DED2',
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
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
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
    shadowColor: '#B99A6B',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#B99A6B',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
