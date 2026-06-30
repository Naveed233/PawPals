import { StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { Tag, VerifiedBadge } from '@/components/ui';
import type { CompatibilityResult } from '@/lib/compatibility';
import { colors, font, radius, shadow, spacing } from '@/theme';
import type { DogProfile } from '@/types';

/**
 * The discovery card. Dog is the hero; the owner appears only as a small
 * supporting preview beneath the dog, per the product brief.
 */
export function DogCard({ dog, compat }: { dog: DogProfile; compat: CompatibilityResult }) {
  return (
    <View style={styles.card}>
      <View style={styles.photoWrap}>
        <DogPhoto dog={dog} style={StyleSheet.absoluteFill} emojiSize={120} />

        <View style={styles.compatBadge}>
          <Text style={styles.compatPct}>{compat.score}%</Text>
          <Text style={styles.compatLabel}>match</Text>
        </View>

        <View style={styles.photoFooter}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {dog.name}
            </Text>
            <Text style={styles.age}>{dog.ageYears}y</Text>
          </View>
          <Text style={styles.breed} numberOfLines={1}>
            {dog.breed} · {dog.sex}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>📍 {dog.distanceKm} km</Text>
            <Text style={styles.meta}>📐 {dog.size}</Text>
            <Text style={styles.meta}>⚡ {dog.energy} energy</Text>
          </View>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.tagRow}>
          {dog.personality.slice(0, 4).map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>

        <Text style={styles.pref}>
          🐾 Prefers a <Text style={styles.prefStrong}>{dog.meetupPref.toLowerCase()}</Text>
        </Text>

        {dog.intents.length > 0 && (
          <View style={styles.tagRow}>
            {dog.intents.slice(0, 2).map((it) => (
              <Tag key={it} label={it} tone="blue" />
            ))}
          </View>
        )}

        <View style={styles.ownerRow}>
          <OwnerAvatar ownerId={dog.ownerId} name={dog.ownerName} style={styles.ownerAvatar} rounded={radius.pill} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName} numberOfLines={1}>
              {dog.ownerName} · {dog.ownerArea}
            </Text>
            <Text style={styles.ownerSub}>Owner</Text>
          </View>
          {dog.ownerVerified && <VerifiedBadge />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  photoWrap: { flex: 1, backgroundColor: colors.forestSoft },
  compatBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    ...shadow.soft,
  },
  compatPct: { color: '#fff', fontWeight: '900', fontSize: font.heading },
  compatLabel: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1, opacity: 0.9 },

  photoFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    backgroundColor: 'rgba(20,30,26,0.45)',
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  name: { color: '#fff', fontSize: font.display, fontWeight: '900', flexShrink: 1 },
  age: { color: '#fff', fontSize: font.title, fontWeight: '600', opacity: 0.9, marginBottom: 3 },
  breed: { color: '#fff', fontSize: font.body, fontWeight: '600', opacity: 0.95, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' },
  meta: { color: '#fff', fontSize: font.small, fontWeight: '600', opacity: 0.95 },

  info: { padding: spacing.lg, gap: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pref: { fontSize: font.body, color: colors.muted },
  prefStrong: { color: colors.forest, fontWeight: '700' },

  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  ownerAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitial: { fontSize: font.body, fontWeight: '800', color: '#3D6A93' },
  ownerName: { fontSize: font.body, fontWeight: '700', color: colors.charcoal },
  ownerSub: { fontSize: font.tiny, color: colors.faint, fontWeight: '600' },
});
