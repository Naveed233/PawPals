import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * One source of truth for the floating pill tab bar's geometry, so the bar,
 * the full-bleed discovery deck, and every scrolling screen agree on how much
 * bottom space to leave — and all of it adapts to the device's safe area
 * (home indicator on notched iPhones, browser chrome on mobile web).
 */
export const TAB_BAR_HEIGHT = 64;

/** How far the tab bar floats above the very bottom edge. */
export function tabBarBottom(insetBottom: number): number {
  return Math.max(insetBottom, 12) + 4;
}

/**
 * Hook: the vertical space a screen must keep clear at the bottom so content
 * never hides behind the floating tab bar, on any device.
 */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return tabBarBottom(insets.bottom) + TAB_BAR_HEIGHT + 12;
}
