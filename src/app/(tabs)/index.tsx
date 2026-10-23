import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PawTrail } from '@/components/anim';
import { Icon } from '@/components/icons';
import { SwipeDeck, SwipeDeckHandle } from '@/components/SwipeDeck';
import { Button } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { activeFilterCount, isSeedDog, matchesFilters } from '@/lib/dogs';
import { useTabBarClearance } from '@/lib/layout';
import { useI18n } from '@/lib/i18n';
import { detectRealMatch } from '@/lib/matching';
import { fetchDiscoverDogs, fetchRemoteMatches, subscribeMatches } from '@/lib/remote';
import { supabase } from '@/lib/supabase';
import { recordSwipeRemote } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, radius, shadow, spacing } from '@/theme';
import type { DogProfile, SwipeDirection } from '@/types';

export default function Discover() {
  const router = useRouter();
  const deckRef = useRef<SwipeDeckHandle>(null);
  const { tx } = useI18n();
  const tabClearance = useTabBarClearance();

  const owner = useStore((s) => s.owner);
  const myDog = useStore((s) => s.dogs[0]);
  const deck = useStore((s) => s.deck);
  const remoteDogs = useStore((s) => s.remoteDogs);
  const swipes = useStore((s) => s.swipes);
  const saved = useStore((s) => s.saved);
  const hiddenDogIds = useStore((s) => s.hiddenDogIds);
  const blockedOwnerIds = useStore((s) => s.blockedOwnerIds);
  const swipeCount = swipes.length;
  const ensureDeck = useStore((s) => s.ensureDeck);
  const swipe = useStore((s) => s.swipe);
  const undo = useStore((s) => s.undo);
  const toggleSave = useStore((s) => s.toggleSave);
  const clearFilters = useStore((s) => s.clearFilters);
  const setRemoteDogs = useStore((s) => s.setRemoteDogs);
  const mergeRemoteMatches = useStore((s) => s.mergeRemoteMatches);
  const updateOwner = useStore((s) => s.updateOwner);

  useEffect(() => {
    ensureDeck();
  }, [ensureDeck]);

  // Repair legacy accounts whose owner.id is the old placeholder 'owner-1'
  // (or otherwise doesn't match the auth uid) — chat "me" detection and match
  // subscriptions compare owner.id to the real uid, so they must agree.
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      const cur = useStore.getState().owner;
      if (uid && cur && cur.id !== uid) updateOwner({ id: uid });
    })();
  }, [owner?.id, updateOwner]);

  // Pull real dogs into the deck + any existing real matches, and listen for
  // new matches created while the user is browsing.
  useEffect(() => {
    let active = true;
    (async () => {
      const [dogs, matches] = await Promise.all([
        fetchDiscoverDogs(owner?.lat, owner?.lon),
        fetchRemoteMatches(),
      ]);
      if (!active) return;
      if (dogs.length) setRemoteDogs(dogs);
      if (matches.length)
        mergeRemoteMatches(
          matches.map((m) => ({
            id: m.matchId,
            dogId: m.dog?.id ?? m.matchId,
            createdAt: m.createdAt,
            matchId: m.matchId,
            otherOwnerId: m.otherOwnerId,
          })),
          matches.map((m) => m.dog).filter((d): d is DogProfile => !!d),
        );
    })();

    const myId = owner?.id;
    const unsub = myId
      ? subscribeMatches(myId, () => {
          void (async () => {
            const matches = await fetchRemoteMatches();
            if (!active) return;
            mergeRemoteMatches(
              matches.map((m) => ({
                id: m.matchId,
                dogId: m.dog?.id ?? m.matchId,
                createdAt: m.createdAt,
                matchId: m.matchId,
                otherOwnerId: m.otherOwnerId,
              })),
              matches.map((m) => m.dog).filter((d): d is DogProfile => !!d),
            );
          })();
        })
      : undefined;

    return () => {
      active = false;
      unsub?.();
    };
    // owner id/coords are stable within a session; re-run only if they change.
  }, [owner?.id, owner?.lat, owner?.lon, setRemoteDogs, mergeRemoteMatches]);

  const filters = useStore((s) => s.filters);
  const filterCount = activeFilterCount(filters);
  const swipedIds = useMemo(() => new Set(swipes.map((s) => s.dogId)), [swipes]);

  const remaining = useMemo<DogProfile[]>(() => {
    const seed = (deck ?? [])
      .map((id) => SEED_DOGS.find((d) => d.id === id))
      .filter((d): d is DogProfile => !!d);
    const remote = remoteDogs.filter(
      (d) => !swipedIds.has(d.id) && d.ownerId !== owner?.id,
    );
    // Real dogs first so early users find each other; seed dogs keep it full.
    const hidden = new Set(hiddenDogIds);
    const blocked = new Set(blockedOwnerIds);
    const seen = new Set<string>();
    return [...remote, ...seed]
      .filter((d) => (seen.has(d.id) ? false : seen.add(d.id)))
      // Reported/blocked profiles vanish from the feed immediately.
      .filter((d) => !hidden.has(d.id) && !blocked.has(d.ownerId))
      .filter((d) => matchesFilters(d, filters));
  }, [deck, remoteDogs, swipedIds, owner?.id, filters, hiddenDogIds, blockedOwnerIds]);

  const top = remaining[0];
  const [burstKey, setBurstKey] = useState(0);

  // Compatibility only applies when the user actually has a dog profile
  // (missing petStatus on older profiles means 'has-dog').
  const compatDog =
    (owner?.petStatus ?? 'has-dog') === 'has-dog' && myDog ? myDog : null;

  // Paw button: play the pawprints walking across the CURRENT dog, then let the
  // card fly off and the next dog appear. (Dragging right flies off directly.)
  const pawLikeBusy = useRef(false);
  const pawLike = () => {
    if (!top || pawLikeBusy.current) return;
    pawLikeBusy.current = true;
    setBurstKey((k) => k + 1); // paws start over the current dog
    setTimeout(() => {
      deckRef.current?.swipe('like');
      pawLikeBusy.current = false;
    }, 780);
  };

  const handleSwipe = (dog: DogProfile, dir: SwipeDirection) => {
    const match = swipe(dog.id, dir);
    recordSwipeRemote(dog.id, dir);

    if (match) {
      router.push({ pathname: '/match', params: { dogId: dog.id } });
    } else if (dir === 'like' && !isSeedDog(dog.id)) {
      // Real dog: the DB trigger decides the match. Check shortly after.
      setTimeout(() => {
        void detectRealMatch(dog.ownerId).then((matchedDogId) => {
          if (matchedDogId) router.push({ pathname: '/match', params: { dogId: matchedDogId } });
        });
      }, 900);
    }
  };

  const isSaved = top ? saved.includes(top.id) : false;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[night.bgTop, night.bg]} style={styles.wash} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/filters')}
            accessibilityRole="button"
            accessibilityLabel={tx('絞り込み', 'Filters')}
            hitSlop={6}
            style={({ pressed }) => [styles.roundBtn, pressed && styles.pressedScale]}
          >
            <Icon name="sliders" color={night.text} size={18} strokeWidth={2.4} />
            {filterCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{filterCount}</Text>
              </View>
            )}
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {tx('さがす', 'Discover')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.deckArea, !top && { marginBottom: tabClearance }]}>
          {deck === null ? (
            <View style={styles.center}>
              <ActivityIndicator color={night.accentInk} size="large" />
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
              {burstKey > 0 && <PawTrail key={burstKey} count={9} />}
            </>
          ) : filterCount > 0 ? (
            // Empty because filters exclude everyone — always give a way out.
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Icon name="search" color={night.text} size={30} />
              </View>
              <Text style={styles.emptyTitle}>
                {tx('条件に合うワンちゃんがいません', 'No dogs match your filters')}
              </Text>
              <Text style={styles.emptyBody}>
                {tx(
                  '絞り込み条件が厳しすぎるようです。条件をクリアするか、調整してみてください。',
                  'Your filters are too narrow. Clear them or adjust to see more dogs.',
                )}
              </Text>
              <Button
                label={tx('絞り込みをクリア', 'Clear filters')}
                onPress={clearFilters}
                style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
              />
              <Button
                label={tx('絞り込みを調整', 'Adjust filters')}
                variant="outline"
                onPress={() => router.push('/filters')}
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          ) : (
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Icon name="pawFill" color={night.text} size={30} />
              </View>
              <Text style={styles.emptyTitle}>
                {tx('今日の出会いはここまで', "That's everyone for today")}
              </Text>
              <Text style={styles.emptyBody}>
                {tx(
                  '近くのわんちゃんをすべてチェックしました。新しい仲間が入ってくるので、また後でのぞいてみてください。',
                  "You've met all the dogs nearby. New pups join all the time — check back soon.",
                )}
              </Text>
            </View>
          )}
        </View>

        {top && (
          <View style={[styles.actions, { marginBottom: tabClearance }]}>
            <View style={styles.actionCol}>
              <Pressable
                onPress={() => deckRef.current?.swipe('pass')}
                accessibilityRole="button"
                accessibilityLabel={tx('パス', 'Pass')}
                hitSlop={6}
                style={({ pressed }) => [styles.roundBtn, styles.passBtn, pressed && styles.pressedScale]}
              >
                <Icon name="x" color={night.text} size={26} strokeWidth={2.6} />
              </Pressable>
              <Text style={styles.actionLabel}>{tx('パス', 'Pass')}</Text>
            </View>
            <Pressable
              onPress={undo}
              disabled={swipeCount === 0}
              accessibilityRole="button"
              accessibilityLabel={tx('元に戻す', 'Undo')}
              accessibilityState={{ disabled: swipeCount === 0 }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.roundBtn,
                swipeCount === 0 && styles.disabled,
                pressed && swipeCount > 0 && styles.pressedScale,
              ]}
            >
              <Icon name="undo" color={night.text} size={20} />
            </Pressable>
            <View style={styles.actionCol}>
              <Pressable
                onPress={pawLike}
                accessibilityRole="button"
                accessibilityLabel={tx('いいね', 'Like')}
                hitSlop={6}
                style={({ pressed }) => [styles.roundBtn, styles.likeBtn, pressed && styles.pressedScale]}
              >
                <Icon name="pawFill" color={night.onAction} size={32} />
              </Pressable>
              <Text style={styles.actionLabel}>{tx('いいね', 'Like')}</Text>
            </View>
            <Pressable
              onPress={() => toggleSave(top.id)}
              accessibilityRole="button"
              accessibilityLabel={tx('保存', 'Save')}
              accessibilityState={{ selected: isSaved }}
              hitSlop={6}
              style={({ pressed }) => [styles.roundBtn, isSaved && styles.savedBtn, pressed && styles.pressedScale]}
            >
              <Icon name="bookmark" color={isSaved ? night.onAction : night.text} size={20} />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.bg },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: font.heading, fontWeight: '900', color: night.text },
  headerSpacer: { width: 44 },

  // The print stack. Its side margins leave room for the tilted back print.
  deckArea: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  actionCol: { alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: font.tiny, fontWeight: '800', color: night.muted },

  roundBtn: {
    width: 48,
    height: 48,
    marginTop: 8,
    borderRadius: radius.pill,
    backgroundColor: night.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  passBtn: { width: 60, height: 60, marginTop: 2 },
  likeBtn: { width: 64, height: 64, marginTop: 0, backgroundColor: night.coral, ...shadow.card },
  savedBtn: { backgroundColor: night.coral },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: night.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { color: night.onAction, fontSize: 10, fontWeight: '900' },
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
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: night.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: night.text, textAlign: 'center' },
  emptyBody: {
    fontSize: font.body,
    color: night.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
