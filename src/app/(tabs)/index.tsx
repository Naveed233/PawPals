import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeartBurst } from '@/components/anim';
import { SwipeDeck, SwipeDeckHandle } from '@/components/SwipeDeck';
import { Button } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { useStore } from '@/store';
import { colors, font, radius, shadow, spacing } from '@/theme';
import type { DogProfile, SwipeDirection } from '@/types';

export default function Discover() {
  const router = useRouter();
  const deckRef = useRef<SwipeDeckHandle>(null);

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

  const handleSwipe = (dog: DogProfile, dir: SwipeDirection) => {
    if (dir === 'like') setBurstKey((k) => k + 1);
    const match = swipe(dog.id, dir);
    if (match) router.push({ pathname: '/match', params: { dogId: dog.id } });
  };

  if (!myDog) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.sub}>Playmates near {myDog.name}</Text>
        </View>
        <View style={styles.count}>
          <Text style={styles.countText}>{remaining.length}</Text>
        </View>
      </View>

      <View style={styles.deckArea}>
        {top ? (
          <SwipeDeck
            ref={deckRef}
            dogs={remaining}
            myDog={myDog}
            onSwipe={handleSwipe}
            onTap={(dog) => router.push(`/dog/${dog.id}`)}
          />
        ) : null}
        {burstKey > 0 && top && <HeartBurst key={burstKey} count={10} size={24} />}
        {!top && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🦴</Text>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyBody}>
              No more dogs nearby right now. Check back later, widen your search, or reset the demo
              deck to swipe again.
            </Text>
            <Button label="Reset demo deck" variant="outline" onPress={resetDemo} style={{ marginTop: spacing.md }} />
          </View>
        )}
      </View>

      {top && (
        <View style={styles.actions}>
          <ActionButton emoji="↺" label="Undo" disabled={swipeCount === 0} onPress={undo} small />
          <ActionButton emoji="✕" label="Pass" tone={colors.danger} onPress={() => deckRef.current?.swipe('pass')} />
          <ActionButton
            emoji={saved.includes(top.id) ? '★' : '☆'}
            label="Save"
            tone={colors.blue}
            small
            onPress={() => toggleSave(top.id)}
          />
          <ActionButton emoji="♥" label="Like" tone={colors.success} onPress={() => deckRef.current?.swipe('like')} />
        </View>
      )}
    </SafeAreaView>
  );
}

function ActionButton({
  emoji,
  label,
  onPress,
  tone = colors.muted,
  disabled,
  small,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  tone?: string;
  disabled?: boolean;
  small?: boolean;
}) {
  const size = small ? 52 : 66;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.action,
        { width: size, height: size, borderColor: tone, opacity: disabled ? 0.35 : 1 },
        pressed && !disabled && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Text style={[styles.actionEmoji, { color: tone, fontSize: small ? 20 : 26 }]}>{emoji}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { fontSize: font.display, fontWeight: '900', color: colors.charcoal },
  sub: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  count: {
    minWidth: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  countText: { fontWeight: '800', color: colors.forestDark, fontSize: font.body },

  deckArea: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.md },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  action: {
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  actionEmoji: { fontWeight: '900' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: colors.charcoal },
  emptyBody: { fontSize: font.body, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
