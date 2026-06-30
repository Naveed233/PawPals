import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Entrance } from '@/components/anim';
import { DogPhoto } from '@/components/DogPhoto';
import { Screen } from '@/components/Screen';
import { Tag, VerifiedBadge } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { computeCompatibility } from '@/lib/compatibility';
import { useStore } from '@/store';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function Matches() {
  const router = useRouter();
  const matches = useStore((s) => s.matches);
  const myDog = useStore((s) => s.dogs[0]);
  const conversations = useStore((s) => s.conversations);

  return (
    <Screen title="Matches" subtitle={`${matches.length} mutual ${matches.length === 1 ? 'match' : 'matches'}`}>
      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emoji}>💚</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyBody}>
            When you and another owner both like each other's dog, they'll appear here so you can plan
            a meetup.
          </Text>
        </View>
      ) : (
        matches.map((m, i) => {
          const dog = SEED_DOGS.find((d) => d.id === m.dogId);
          if (!dog) return null;
          const compat = myDog ? computeCompatibility(myDog, dog).score : 0;
          const convo = conversations[dog.id] ?? [];
          const last = convo[convo.length - 1];
          const preview = last ? (last.kind === 'image' ? '📷 Photo' : last.text) : null;
          return (
            <Entrance key={m.id} delay={i * 70}>
              <Pressable
                onPress={() => router.push(`/chat/${dog.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open chat with ${dog.name}`}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              >
              <DogPhoto dog={dog} style={styles.thumb} rounded={radius.md} emojiSize={34} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{dog.name}</Text>
                  {dog.ownerVerified && <VerifiedBadge />}
                </View>
                <Text style={styles.breed}>
                  {dog.breed} · {dog.ageYears}y · {dog.distanceKm} km
                </Text>
                <View style={styles.metaRow}>
                  <Tag label={`${compat}% match`} />
                  <Text style={styles.owner}>with {dog.ownerName}</Text>
                </View>
                {!!preview && (
                  <Text style={styles.preview} numberOfLines={1}>
                    {last.sender === 'me' ? 'You: ' : ''}
                    {preview}
                  </Text>
                )}
              </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Entrance>
          );
        })
      )}

      {matches.length > 0 && (
        <Text style={styles.footnote}>
          Tap a match to chat, share photos, or start a voice/video call.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.soft,
  },
  thumb: { width: 64, height: 64 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: font.heading, fontWeight: '800', color: colors.charcoal },
  breed: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  owner: { fontSize: font.small, color: colors.faint, fontWeight: '600' },
  preview: { fontSize: font.small, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 28, color: colors.faint, fontWeight: '300' },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emoji: { fontSize: 56 },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: colors.charcoal },
  emptyBody: { fontSize: font.body, color: colors.muted, textAlign: 'center', lineHeight: 21, paddingHorizontal: spacing.lg },

  footnote: { fontSize: font.tiny, color: colors.faint, textAlign: 'center', marginTop: spacing.md },
});
