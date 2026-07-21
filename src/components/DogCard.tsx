import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import type { CompatibilityResult } from '@/lib/compatibility';
import { useI18n } from '@/lib/i18n';
import { displayPhotos } from '@/lib/photos';
import { font, night, radius, shadow, spacing } from '@/theme';
import type { DogProfile } from '@/types';

/**
 * The discovery card: a full-bleed dog photo with frosted-glass overlays and a
 * bottom scrim carrying the essentials. `compat` is null when the current user
 * has no dog profile — the compatibility pill is simply skipped.
 */
export function DogCard({ dog, compat }: { dog: DogProfile; compat: CompatibilityResult | null }) {
  const { tx } = useI18n();
  const photoCount = displayPhotos(dog, 1).filter((p) => p.uri || p.module).length;
  return (
    // pointerEvents="none": the card is purely visual — the SwipeDeck's
    // GestureDetector (our parent) handles pan/tap. Critically, on web this
    // also stops the <img> from hijacking mouse drags as native image-drag,
    // which silently killed the swipe gesture.
    <View style={styles.card} pointerEvents="none">
      <DogPhoto dog={dog} style={StyleSheet.absoluteFill} emojiSize={120} />

      {/* Top-left: area pill + optional compatibility pill */}
      <View style={styles.topLeft} pointerEvents="none">
        <View style={styles.glassPill}>
          <Icon name="pin" color="#fff" size={13} />
          <Text style={styles.pillText}>{dog.ownerArea}</Text>
        </View>
        {compat && (
          <View style={[styles.glassPill, styles.compatPill]}>
            <Icon name="pawFill" color="#fff" size={13} />
            <Text style={styles.pillText}>
              {tx(`相性 ${compat.score}%`, `${compat.score}% match`)}
            </Text>
          </View>
        )}
      </View>

      {/* Top-center: photo count (tap the card to browse them all) */}
      {photoCount > 1 && (
        <View style={styles.photoCountWrap} pointerEvents="none">
          <View style={styles.photoCount}>
            <Icon name="camera" color="#fff" size={12} />
            <Text style={styles.photoCountText}>{photoCount}</Text>
          </View>
        </View>
      )}

      {/* Bottom scrim with the dog's essentials */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.scrim}
        pointerEvents="none"
      >
        <Text style={styles.distance}>
          {tx(`${dog.distanceKm}km先`, `${dog.distanceKm} km away`)}
        </Text>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {dog.name}
          </Text>
          {dog.ownerVerified && (
            <View style={styles.verifiedDot} accessibilityLabel={tx('認証済み', 'Verified')}>
              <Icon name="check" color="#fff" size={11} strokeWidth={3.5} />
            </View>
          )}
        </View>
        <Text style={styles.breed} numberOfLines={1}>
          {tx(`${dog.breed}・${dog.ageYears}歳`, `${dog.breed} · ${dog.ageYears} yrs`)}
        </Text>
        {!!dog.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {dog.notes}
          </Text>
        )}
        <Text style={styles.more}>{tx('もっと見る', 'See more')}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: night.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: night.border,
    ...shadow.card,
  },

  topLeft: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: 76, // keep clear of the floating pass button
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(22,6,13,0.45)',
    borderWidth: 1,
    borderColor: night.border,
  },
  photoCountWrap: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(22,6,13,0.55)',
  },
  photoCountText: { color: '#fff', fontSize: font.tiny, fontWeight: '800' },
  compatPill: {
    backgroundColor: 'rgba(247,46,99,0.32)',
    borderColor: 'rgba(247,46,99,0.55)',
  },
  pillText: { color: '#fff', fontSize: font.small, fontWeight: '700' },

  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: 72,
    paddingBottom: spacing.xl,
    gap: 3,
  },
  distance: { color: night.muted, fontSize: font.small, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: '#fff', fontSize: font.display, fontWeight: '900', flexShrink: 1 },
  verifiedDot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: night.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breed: { color: 'rgba(255,255,255,0.92)', fontSize: font.body, fontWeight: '600' },
  notes: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: font.small,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 2,
  },
  more: { color: '#fff', fontSize: font.body, fontWeight: '800', marginTop: 2 },
});
