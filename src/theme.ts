/**
 * PawPair design tokens.
 *
 * Palette per the product brief:
 *  - Warm cream background
 *  - Forest green primary
 *  - Coral accent
 *  - Soft blue secondary
 *  - Dark charcoal text
 *
 * Keep all colour / spacing / radius / typography decisions here so screens
 * stay visually consistent and a future theme change is a single edit.
 */

export const colors = {
  cream: '#FBF7EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EEE2',

  forest: '#2E5E4E',
  forestDark: '#234A3D',
  forestSoft: '#E4EFE9',

  coral: '#F2765E',
  coralSoft: '#FBE3DC',

  blue: '#6FA8DC',
  blueSoft: '#E5EEF7',

  charcoal: '#2B2B2B',
  ink: '#1C1B19',
  muted: '#6E6A60',
  faint: '#9C978B',

  border: '#E7E0D2',
  success: '#3F9D6B',
  warning: '#E0A33B',
  danger: '#D7503C',

  overlayLike: 'rgba(63,157,107,0.85)',
  overlayPass: 'rgba(215,80,60,0.85)',

  // Welcome-screen hero gradient: sunny gold → tangerine → coral pink
  sunrise: ['#FFD86F', '#FF9D5C', '#FF6F7E'],
} as const;

/**
 * Night theme — the main app's dark magenta look (discover, messages, map,
 * onboarding, profile...). Welcome/auth screens keep their own palettes.
 */
export const night = {
  bg: '#160409',
  bgTop: '#360A1E', // gradient wash for screen tops
  card: '#251019',
  surface: 'rgba(255,255,255,0.08)',
  surfaceHi: 'rgba(255,255,255,0.14)',
  border: 'rgba(255,255,255,0.12)',
  input: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: '#C2A5B1',
  faint: '#8E7280',
  pink: '#F72E63',
  pinkDeep: '#C71E4E',
  pinkSoft: 'rgba(247,46,99,0.20)',
  navy: '#1C2333', // map background
  navyLine: '#2B3448', // map streets
  success: '#4CD98A',
  danger: '#FF6B5E',
  tabBar: 'rgba(24,8,15,0.94)',
} as const;

/** Pastel palette for the light pet-profile page (dog/[id]). */
export const pastel = {
  hero: '#EBC5AC',
  sheet: '#FFFFFF',
  lavender: '#E4D9F7',
  lavenderText: '#4B3A6E',
  butter: '#FBF0C4',
  butterText: '#7A6420',
  mint: '#D9EED2',
  mintText: '#3F6B34',
  ink: '#171513',
  mutedInk: '#8A857E',
  orange: '#F09E4C',
  dashed: '#D8D2C8',
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;
