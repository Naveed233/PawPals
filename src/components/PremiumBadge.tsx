import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icon } from '@/components/icons';
import { font, radius, spacing, tone } from '@/theme';

/**
 * "Premium" pill. Everything is free today — this simply marks which features
 * become paid later, so the value ladder is visible now and the paywall can
 * switch on without a redesign. Butter with gold ink so it reads as "premium",
 * distinct from the cobalt action colour.
 */
export function PremiumBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, style]}>
      <Icon name="star" color={tone.butterInk} size={10} strokeWidth={2.6} />
      <Text style={styles.text}>Premium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: tone.butter,
    borderWidth: 1,
    borderColor: 'rgba(110,81,0,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: { color: tone.butterInk, fontSize: font.tiny, fontWeight: '800', letterSpacing: 0.3 },
});
