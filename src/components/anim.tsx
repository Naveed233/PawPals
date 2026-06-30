import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/*
 * Animation principle here: motion is an ENHANCEMENT, never a gate on content.
 * Entrances keep opacity at 1 and animate only transform with a small offset,
 * so if the animation engine is paused (e.g. a backgrounded tab that throttles
 * requestAnimationFrame) content is still fully visible — just not mid-slide.
 */

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

/** Pressable that springs down on press for tactile feedback. */
export function AnimatedPressable({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  hitSlop,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressableBase
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 9, stiffness: 260 });
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={[style, aStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}

/** Mount entrance: slides up a few px. Opacity stays 1 (content never hidden). */
export function Entrance({
  children,
  delay = 0,
  distance = 14,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [p, delay]);
  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: distance * (1 - p.value) }],
  }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/** Mount "pop": a subtle spring scale. Opacity stays 1. */
export function Pop({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 180 }));
  }, [p, delay]);
  const s = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + 0.06 * Math.min(1, p.value) }],
  }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/**
 * A one-shot burst of hearts radiating from the centre. Plays on mount; give it
 * a changing `key` to replay. Self-clears after ~1s via a timer (no RAF needed)
 * so it never lingers even if the animation engine is paused.
 */
export function HeartBurst({
  count = 9,
  emojis = ['💚', '💛', '🧡', '🩷', '🤎'],
  size = 22,
}: {
  count?: number;
  emojis?: string[];
  size?: number;
}) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;

  return (
    <View pointerEvents="none" style={styles.burst}>
      {Array.from({ length: count }).map((_, i) => (
        <Heart key={i} index={i} count={count} emoji={emojis[i % emojis.length]} size={size} />
      ))}
    </View>
  );
}

function Heart({ index, count, emoji, size }: { index: number; count: number; emoji: string; size: number }) {
  const p = useSharedValue(0);
  const angle = (index / count) * Math.PI * 2;
  const dist = 64 + (index % 3) * 22;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;

  useEffect(() => {
    p.value = withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) });
  }, [p]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: dx * p.value },
      { translateY: dy * p.value - 14 * p.value },
      { scale: 0.5 + p.value },
    ],
  }));

  return <Animated.Text style={[styles.heart, { fontSize: size }, aStyle]}>{emoji}</Animated.Text>;
}

const styles = StyleSheet.create({
  burst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { position: 'absolute' },
});
