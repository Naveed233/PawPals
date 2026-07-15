import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeartBurst } from '@/components/anim';
import { Icon } from '@/components/icons';
import { SwipeDeck, SwipeDeckHandle } from '@/components/SwipeDeck';
import { Button } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { recordSwipeRemote } from '@/lib/sync';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';
import type { DogProfile, SwipeDirection } from '@/types';

export default function Discover() {
  const router = useRouter();
  const deckRef = useRef<SwipeDeckHandle>(null);
  const { tx } = useI18n();

  const owner = useStore((s) => s.owner);
  const myDog = useStore((s) => s.dogs[0]);
  const deck = useStore((s) => s.deck);
  const saved = useStore((s) => s.saved);
  const swipeCount = useStore((s) => s.swipes.length);
  const ensureDeck = useStore((s) => s.ensureDeck);
  const swipe = useStore((s) => s.swipe);
  const undo = useStore((s) => s.undo);
  const toggleSave = useStore((s) => s.toggleSave);
  const resetDemo = useStore((s) => s.resetDemo);

  useEffect(() => {
    ensureDeck();
  }, [ensureDeck]);

  const remaining = useMemo<DogProfile[]>(
    () =>
      (deck ?? [])
        .map((id) => SEED_DOGS.find((d) => d.id === id))
        .filter((d): d is DogProfile => !!d),
    [deck],
  );

  const top = remaining[0];
  const [burstKey, setBurstKey] = useState(0);

  // Compatibility only applies when the user actually has a dog profile
  // (missing petStatus on older profiles means 'has-dog').
  const compatDog =
    (owner?.petStatus ?? 'has-dog') === 'has-dog' && myDog ? myDog : null;

  const handleSwipe = (dog: DogProfile, dir: SwipeDirection) => {
    if (dir === 'like') setBurstKey((k) => k + 1);
    const match = swipe(dog.id, dir);
    recordSwipeRemote(dog.id, dir);
    if (match) router.push({ pathname: '/match', params: { dogId: dog.id } });
  };

  const isSaved = top ? saved.includes(top.id) : false;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[night.bgTop, night.bg]} style={styles.wash} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.deckArea}>
          {deck === null ? (
            <View style={styles.center}>
              <ActivityIndicator color={night.pink} size="large" />
              <Text style={styles.loadingText}>{tx('読み込み中…', 'Loading…')}</Text>
            </View>
          ) : top ? (
            <>
              <SwipeDeck
                ref={deckRef}
                dogs={remaining}
                myDog={compatDog}
                onSwipe={handleSwipe}
                onTap={(dog) => router.push(`/dog/${dog.id}`)}
              />
              {burstKey > 0 && <HeartBurst key={burstKey} count={10} size={24} />}

              {/* Floating pass pill — card top-right, labelled for visibility */}
              <Pressable
                onPress={() => deckRef.current?.swipe('pass')}
                accessibilityRole="button"
                accessibilityLabel={tx('パス', 'Pass')}
                hitSlop={6}
                style={({ pressed }) => [styles.passPill, pressed && styles.pressedScale]}
              >
                <Icon name="x" color="#fff" size={16} strokeWidth={2.6} />
                <Text style={styles.passPillText}>{tx('パス', 'Pass')}</Text>
              </Pressable>

              {/* Right-side floating action rail */}
              <View style={styles.sideStack}>
                <Pressable
                  onPress={() => deckRef.current?.swipe('like')}
                  accessibilityRole="button"
                  accessibilityLabel={tx('いいね', 'Like')}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.glassCircle,
                    styles.likeBtn,
                    pressed && styles.pressedScale,
                  ]}
                >
                  <Icon name="heartFill" color={night.pink} size={26} />
                </Pressable>
                <Pressable
                  onPress={undo}
                  disabled={swipeCount === 0}
                  accessibilityRole="button"
                  accessibilityLabel={tx('元に戻す', 'Undo')}
                  accessibilityState={{ disabled: swipeCount === 0 }}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.glassCircle,
                    swipeCount === 0 && styles.disabled,
                    pressed && swipeCount > 0 && styles.pressedScale,
                  ]}
                >
                  <Icon name="undo" color="#fff" size={20} />
                </Pressable>
                <Pressable
                  onPress={() => toggleSave(top.id)}
                  accessibilityRole="button"
                  accessibilityLabel={tx('保存', 'Save')}
                  accessibilityState={{ selected: isSaved }}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.glassCircle,
                    isSaved && styles.savedBtn,
                    pressed && styles.pressedScale,
                  ]}
                >
                  <Icon name="bookmark" color={isSaved ? night.pink : '#fff'} size={20} />
                </Pressable>
              </View>

            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🦴</Text>
              <Text style={styles.emptyTitle}>
                {tx('今日の出会いはここまで', "That's everyone for today")}
              </Text>
              <Text style={styles.emptyBody}>
                {tx(
                  '近くのわんちゃんをすべてチェックしました。また後でのぞいてみてください。デモ用にデッキをリセットすることもできます。',
                  "You've met all the dogs nearby. Check back later — or reset the deck to demo again.",
                )}
              </Text>
              <Button
                label={tx('デッキをリセット', 'Reset deck')}
                variant="outline"
                onPress={resetDemo}
                style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.bg },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  // Full-bleed deck: the card is the screen. Only the floating tab bar is
  // cleared at the bottom.
  deckArea: {
    flex: 1,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: 96,
  },

  glassCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(22,6,13,0.5)',
    borderWidth: 1,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passPill: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22,6,13,0.62)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,94,0.7)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  passPillText: { color: '#fff', fontSize: font.small, fontWeight: '800', letterSpacing: 0.3 },
  sideStack: {
    position: 'absolute',
    right: spacing.lg,
    top: '28%',
    gap: spacing.md,
    alignItems: 'center',
  },
  likeBtn: {
    width: 58,
    height: 58,
    backgroundColor: 'rgba(247,46,99,0.28)',
    borderColor: 'rgba(247,46,99,0.55)',
  },
  savedBtn: {
    backgroundColor: night.pinkSoft,
    borderColor: 'rgba(247,46,99,0.55)',
  },
  disabled: { opacity: 0.35 },
  pressedScale: { transform: [{ scale: 0.92 }] },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: { color: night.muted, fontSize: font.small, fontWeight: '600' },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: night.text },
  emptyBody: {
    fontSize: font.body,
    color: night.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
