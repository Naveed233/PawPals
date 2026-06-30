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
  muted: '#6E6A60',
  faint: '#9C978B',

  border: '#E7E0D2',
  success: '#3F9D6B',
  warning: '#E0A33B',
  danger: '#D7503C',

  overlayLike: 'rgba(63,157,107,0.85)',
  overlayPass: 'rgba(215,80,60,0.85)',
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
