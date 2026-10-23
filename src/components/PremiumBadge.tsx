import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { font, radius, spacing } from '@/theme';

/**
 * "Premium" pill. Everything is free today — this simply marks which features
 * become paid later, so the value ladder is visible now and the paywall can
 * switch on without a redesign. Gold so it reads as "premium", distinct from
 * the pink brand accent.
 */
export function PremiumBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>★ Premium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(240,196,74,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(240,196,74,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: { color: '#F0C44A', fontSize: font.tiny, fontWeight: '800', letterSpacing: 0.3 },
});
