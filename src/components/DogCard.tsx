import { StyleSheet, Text, View } from 'react-native';

import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import type { CompatibilityResult } from '@/lib/compatibility';
import { useI18n } from '@/lib/i18n';
import { displayPhotos } from '@/lib/photos';
import { font, night, radius, shadow, spacing, tone } from '@/theme';
import type { DogProfile } from '@/types';

/**
 * The discovery card, drawn as an instant-photo print: a white frame, the
 * photo set inside it, and a thick caption strip under it carrying the
 * essentials. The photo stays clean (only a compatibility sticker and the
 * photo count sit on it), so the dog is the hero.
 */
export function DogCard({ dog, compat }: { dog: DogProfile; compat: CompatibilityResult | null }) {
  const { tx } = useI18n();
  const photoCount = displayPhotos(dog, 1).filter((p) => p.uri || p.module).length;
  return (
    // pointerEvents="none": the card is purely visual — the SwipeDeck's
    // GestureDetector (our parent) handles pan/tap. On web this also stops the
    // <img> from hijacking mouse drags as native image-drag.
    <View style={styles.print} pointerEvents="none">
      <View style={styles.photo}>
        <DogPhoto dog={dog} style={StyleSheet.absoluteFill} emojiSize={120} contentPosition={dog.photoFocus ?? 'top'} />

        {photoCount > 1 && (
          <View style={styles.photoCount}>
            <Icon name="camera" color="#fff" size={12} />
            <Text style={styles.photoCountText}>{photoCount}</Text>
          </View>
        )}

        {compat && (
          <View style={styles.compat}>
            <Icon name="pawFill" color={tone.onReward} size={13} />
            <Text style={styles.compatText}>{tx(`相性 ${compat.score}%`, `${compat.score}% match`)}</Text>
          </View>
        )}
      </View>

      <View style={styles.caption}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {dog.name}
          </Text>
          {dog.ownerVerified && (
            <View style={styles.verified} accessibilityLabel={tx('認証済み', 'Verified')}>
              <Icon name="check" color="#fff" size={11} strokeWidth={3.5} />
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Icon name="chevronRight" color={night.muted} size={20} />
        </View>
        <Text style={styles.breed} numberOfLines={1}>
          {tx(`${dog.breed}・${dog.ageYears}歳`, `${dog.breed} · ${dog.ageYears} yrs`)}
        </Text>
        <View style={styles.metaRow}>
          <Icon name="pin" color={night.muted} size={14} strokeWidth={2.2} />
          <Text style={styles.meta} numberOfLines={1}>
            {tx(`${dog.ownerArea}・${dog.distanceKm}km先`, `${dog.ownerArea} · ${dog.distanceKm} km away`)}
          </Text>
        </View>
        {!!dog.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {dog.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

const FRAME = 12;

const styles = StyleSheet.create({
  print: {
    flex: 1,
    backgroundColor: tone.print,
    borderRadius: radius.print,
    padding: FRAME,
    paddingBottom: 0,
    ...shadow.print,
  },
  photo: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: tone.input,
  },

  photoCount: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(17,22,44,0.55)',
  },
  photoCountText: { color: '#fff', fontSize: font.tiny, fontWeight: '800' },

  // A sunflower sticker in the corner of the photo (a reward moment).
  compat: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tone.reward,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  compatText: { color: tone.onReward, fontSize: font.small, fontWeight: '800' },

  // The thick bottom margin of an instant print.
  caption: {
    paddingHorizontal: 4,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 3,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: tone.ink, fontSize: 28, fontWeight: '900', letterSpacing: -0.4, flexShrink: 1 },
  verified: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: tone.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breed: { color: tone.ink, fontSize: font.body, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: tone.inkMuted, fontSize: font.small, fontWeight: '600', flexShrink: 1 },
  notes: { color: tone.inkMuted, fontSize: font.small, lineHeight: 19, marginTop: 2 },
});
