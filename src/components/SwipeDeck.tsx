import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DogCard } from '@/components/DogCard';
import { computeCompatibility } from '@/lib/compatibility';
import { useI18n } from '@/lib/i18n';
import { font, night, radius, spacing } from '@/theme';
import type { DogProfile, SwipeDirection } from '@/types';

export interface SwipeDeckHandle {
  swipe: (dir: SwipeDirection) => void;
}

interface Props {
  dogs: DogProfile[]; // remaining, index 0 = top
  /** The user's own dog, or null when they have none — compat is skipped. */
  myDog: DogProfile | null;
  onSwipe: (dog: DogProfile, dir: SwipeDirection) => void;
  onTap: (dog: DogProfile) => void;
}

export const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(function SwipeDeck(
  { dogs, myDog, onSwipe, onTap },
  ref,
) {
  const { width } = useWindowDimensions();
  const THRESHOLD = width * 0.26;
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // `tx` is taken by the translateX shared value above — alias the translator.
  const { lang, tx: t } = useI18n();

  const top = dogs[0];
  const next = dogs[1];

  // Compatibility needs the user's own dog; null hides the badge entirely.
  const compatFor = (dog: DogProfile) => (myDog ? computeCompatibility(myDog, dog, lang) : null);

  // Runs on the JS thread once a card has flown off-screen.
  // Order matters: swap the data FIRST (so the flown card unmounts and the
  // next card — keyed by id — takes top position), THEN reset the shared
  // values. Resetting before the swap made the flown card snap back to centre
  // for a frame, which read as a flash of the previous dog.
  const finish = (dog: DogProfile, dir: SwipeDirection) => {
    onSwipe(dog, dir);
    tx.value = 0;
    ty.value = 0;
  };

  const animateOut = (dir: SwipeDirection) => {
    if (!top) return;
    const toX = (dir === 'like' ? 1 : -1) * width * 1.5;
    const dog = top;
    tx.value = withTiming(toX, { duration: 220 }, (done) => {
      if (done) runOnJS(finish)(dog, dir);
    });
  };

  useImperativeHandle(ref, () => ({ swipe: animateOut }), [top, width]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > THRESHOLD) {
        const dir: SwipeDirection = e.translationX > 0 ? 'like' : 'pass';
        const toX = (e.translationX > 0 ? 1 : -1) * width * 1.5;
        const dog = top;
        tx.value = withTiming(toX, { duration: 200 }, (done) => {
          if (done && dog) runOnJS(finish)(dog, dir);
        });
      } else {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      }
    });

  const tap = Gesture.Tap().maxDistance(10).onEnd(() => {
    if (top) runOnJS(onTap)(top);
  });

  const gesture = Gesture.Race(pan, tap);

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${interpolate(tx.value, [-width, 0, width], [-9, 0, 9], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  if (!top) return null;

  return (
    <View style={styles.deck}>
      {/* Back card */}
      {next && (
        <View style={[styles.cardLayer, styles.backCard]} pointerEvents="none">
          <DogCard dog={next} compat={compatFor(next)} />
        </View>
      )}

      {/* Top card — keyed by id so a swiped card unmounts cleanly instead of
          snapping back to centre as the deck advances. */}
      <GestureDetector gesture={gesture}>
        <Animated.View key={top.id} style={[styles.cardLayer, topStyle]}>
          <DogCard dog={top} compat={compatFor(top)} />

          <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]} pointerEvents="none">
            <Text style={[styles.stampText, { color: night.coral }]}>{t('いいね', 'LIKE')}</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.passStamp, passStyle]} pointerEvents="none">
            <Text style={[styles.stampText, { color: night.danger }]}>{t('パス', 'PASS')}</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  deck: { flex: 1 },
  cardLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backCard: { transform: [{ scale: 0.95 }, { translateY: 14 }] },

  stamp: {
    position: 'absolute',
    top: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 3,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  likeStamp: { left: spacing.xl, borderColor: night.coral, transform: [{ rotate: '-14deg' }] },
  passStamp: { right: spacing.xl, borderColor: night.danger, transform: [{ rotate: '14deg' }] },
  stampText: { fontSize: font.title, fontWeight: '900', letterSpacing: 2 },
});
