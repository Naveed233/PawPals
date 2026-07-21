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
 * The discovery card — the dog is the hero: a full-bleed photo, no border, and
 * only a soft gradient across the bottom carrying the essentials. A big white
 * distance badge and a green location badge sit top-left.
 */
export function DogCard({ dog, compat }: { dog: DogProfile; compat: CompatibilityResult | null }) {
  const { tx } = useI18n();
  const photoCount = displayPhotos(dog, 1).filter((p) => p.uri || p.module).length;
  return (
    // pointerEvents="none": the card is purely visual — the SwipeDeck's
    // GestureDetector (our parent) handles pan/tap. On web this also stops the
    // <img> from hijacking mouse drags as native image-drag.
    <View style={styles.card} pointerEvents="none">
      <DogPhoto dog={dog} style={StyleSheet.absoluteFill} emojiSize={120} />

      {/* Top-left: big distance badge + green location badge + optional compat */}
      <View style={styles.topLeft} pointerEvents="none">
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {tx(`${dog.distanceKm}km先`, `${dog.distanceKm} km away`)}
          </Text>
        </View>
        <View style={styles.locationBadge}>
          <Icon name="pin" color="#fff" size={13} strokeWidth={2.4} />
          <Text style={styles.locationText}>{dog.ownerArea}</Text>
        </View>
        {compat && (
          <View style={styles.compatBadge}>
            <Icon name="pawFill" color={night.coral} size={13} />
            <Text style={styles.compatText}>{tx(`相性 ${compat.score}%`, `${compat.score}% match`)}</Text>
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

      {/* Soft gradient across the bottom ~40% only — the dog stays the hero */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.62)']}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
        pointerEvents="none"
      >
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
    backgroundColor: night.surfaceHi,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },

  topLeft: {
    position: 'absolute',
    // Sit below the discovery filter button (44px) so the two never collide.
    top: spacing.lg + 52,
    left: spacing.lg,
    right: 76, // keep clear of the floating pass button
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  distanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  distanceText: { color: night.coral, fontSize: font.body, fontWeight: '900' },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: night.forest,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  locationText: { color: '#fff', fontSize: font.small, fontWeight: '800' },
  compatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  compatText: { color: night.text, fontSize: font.small, fontWeight: '800' },

  photoCountWrap: { position: 'absolute', top: spacing.lg, left: 0, right: 0, alignItems: 'center' },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  photoCountText: { color: '#fff', fontSize: font.tiny, fontWeight: '800' },

  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '42%',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: 3,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: '#fff', fontSize: font.display, fontWeight: '900', flexShrink: 1 },
  verifiedDot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: night.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breed: { color: 'rgba(255,255,255,0.95)', fontSize: font.body, fontWeight: '700' },
  notes: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: font.small,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 2,
  },
  more: { color: '#fff', fontSize: font.body, fontWeight: '800', marginTop: 4 },
});
