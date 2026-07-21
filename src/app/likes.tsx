import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Screen } from '@/components/Screen';
import { seedLikedYou } from '@/lib/dogs';
import { useI18n } from '@/lib/i18n';
import { fetchWhoLikedMe } from '@/lib/remote';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';
import type { DogProfile } from '@/types';

/**
 * "Who liked you" (Premium — free for now). Real users who liked one of your
 * dogs, plus demo entries so the screen looks alive pre-launch. Tap a card to
 * open the profile and like back.
 */
export default function Likes() {
  const router = useRouter();
  const { tx } = useI18n();
  const swipes = useStore((s) => s.swipes);
  const [remote, setRemote] = useState<DogProfile[]>([]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/matches'));

  useEffect(() => {
    let active = true;
    void fetchWhoLikedMe().then((r) => {
      if (active) setRemote(r);
    });
    return () => {
      active = false;
    };
  }, []);

  const swiped = useMemo(() => new Set(swipes.map((s) => s.dogId)), [swipes]);
  const cards = useMemo(() => {
    const seen = new Set<string>();
    return [...remote, ...seedLikedYou()]
      .filter((d) => !swiped.has(d.id))
      .filter((d) => (seen.has(d.id) ? false : seen.add(d.id)));
  }, [remote, swiped]);

  return (
    <Screen
      title={tx('あなたにいいね', 'Who liked you')}
      onBack={goBack}
      right={<PremiumBadge />}
    >
      {cards.length > 0 ? (
        <>
          <Text style={styles.count}>
            {tx(`${cards.length}件のいいね`, `${cards.length} ${cards.length === 1 ? 'like' : 'likes'}`)}
          </Text>
          <View style={styles.grid}>
            {cards.map((dog) => (
              <Pressable
                key={dog.id}
                onPress={() => router.push(`/dog/${dog.id}`)}
                accessibilityRole="button"
                accessibilityLabel={tx(`${dog.name}のプロフィールを開く`, `Open ${dog.name}'s profile`)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              >
                <DogPhoto dog={dog} style={styles.photo} rounded={radius.lg} emojiSize={40} />
                <View style={styles.likeChip}>
                  <Icon name="pawFill" color="#fff" size={12} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name} numberOfLines={1}>
                    {dog.name}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {tx(`${dog.breed}・${dog.distanceKm}km`, `${dog.breed} · ${dog.distanceKm}km`)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💗</Text>
          <Text style={styles.emptyTitle}>{tx('まだいいねがありません', 'No likes yet')}</Text>
          <Text style={styles.emptyBody}>
            {tx(
              'スワイプを続けましょう。あなたにいいねした人がここに表示されます。',
              'Keep swiping — people who like you will show up here.',
            )}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { color: night.muted, fontSize: font.small, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: night.card,
    borderWidth: 1,
    borderColor: night.border,
  },
  photo: { width: '100%', height: 180 },
  likeChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: night.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { padding: spacing.md, gap: 2 },
  name: { color: night.text, fontSize: font.body, fontWeight: '800' },
  sub: { color: night.muted, fontSize: font.tiny },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl * 2, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: night.text, fontSize: font.title, fontWeight: '800' },
  emptyBody: { color: night.muted, fontSize: font.body, textAlign: 'center', lineHeight: 22 },
});
