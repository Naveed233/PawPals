import { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { font, night, radius } from '@/theme';

export const WHEEL_ROW = 44;
const VISIBLE_ROWS = 5; // odd, so one row sits in the middle as the selection
const PAD = WHEEL_ROW * ((VISIBLE_ROWS - 1) / 2);

/**
 * A scrolling "drum" column, like the iOS time picker. Rows snap to the middle
 * (snapToInterval on native, CSS scroll-snap on web — react-native-web ignores
 * snapToInterval), rows tilt and fade away from the middle, and tapping a row
 * scrolls to it. On web the column is focusable and takes ↑/↓/Home/End.
 */
export function Wheel({
  values,
  index,
  onChange,
  format,
  label,
  width = 76,
}: {
  values: number[];
  index: number;
  onChange: (index: number) => void;
  format: (v: number) => string;
  /** Spoken name of the column, e.g. "Hour". */
  label: string;
  width?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const y = useSharedValue(index * WHEEL_ROW);
  const committed = useRef(index);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clampIndex = (i: number) => Math.max(0, Math.min(values.length - 1, i));

  const scrollToIndex = (i: number, animated: boolean) => {
    ref.current?.scrollTo({ y: i * WHEEL_ROW, animated });
    if (!animated) y.set(i * WHEEL_ROW);
  };

  const commit = (i: number) => {
    if (i === committed.current) return;
    committed.current = i;
    onChange(i);
  };

  // The selection changed from outside (a quick pick): move the drum to it.
  useEffect(() => {
    if (index === committed.current) return;
    committed.current = index;
    scrollToIndex(index, true);
    // scrollToIndex only touches the ref and a shared value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  // Scroll events keep coming while the drum spins; commit once they stop.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.y;
    y.set(offset);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => commit(clampIndex(Math.round(offset / WHEEL_ROW))), 120);
  };

  const step = (delta: number) => {
    const i = clampIndex(committed.current + delta);
    scrollToIndex(i, true);
    commit(i);
  };

  const onKeyDown = (e: { key: string; preventDefault: () => void }) => {
    const moves: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -5,
      PageDown: 5,
      Home: -values.length,
      End: values.length,
    };
    if (moves[e.key] == null) return;
    e.preventDefault();
    step(moves[e.key]);
  };

  return (
    <View
      style={[styles.column, { width }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      // aria-* (not accessibilityValue): react-native-web only reads these, and
      // React Native maps them to the same native accessibility value.
      aria-valuetext={format(values[index])}
      aria-valuenow={index}
      aria-valuemin={0}
      aria-valuemax={values.length - 1}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      focusable
      {...(Platform.OS === 'web' ? ({ onKeyDown } as object) : null)}
    >
      <View pointerEvents="none" style={styles.band} />
      <ScrollView
        ref={ref}
        onLayout={() => scrollToIndex(committed.current, false)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PAD }}
        style={Platform.OS === 'web' ? (webSnap as object) : undefined}
      >
        {values.map((v, i) => (
          <WheelRow
            key={v}
            i={i}
            text={format(v)}
            y={y}
            onPress={() => {
              scrollToIndex(i, true);
              commit(i);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function WheelRow({ i, text, y, onPress }: { i: number; text: string; y: SharedValue<number>; onPress: () => void }) {
  // Distance from the middle row, in rows: 0 = selected. Rows above tilt back,
  // rows below tilt forward, and both fade — a drum seen from the front.
  const style = useAnimatedStyle(() => {
    const d = y.get() / WHEEL_ROW - i;
    const far = Math.min(Math.abs(d), 2.5);
    return {
      opacity: 1 - far * 0.3,
      transform: [
        { perspective: 400 },
        { rotateX: `${Math.max(-60, Math.min(60, d * 22))}deg` },
        { scale: 1 - far * 0.08 },
      ],
    };
  });
  return (
    <Pressable
      onPress={onPress}
      // The column is the accessible control; rows are only a pointer shortcut.
      accessible={false}
      tabIndex={-1}
      style={[styles.row, Platform.OS === 'web' && (webSnapRow as object)]}
    >
      <Animated.Text style={[styles.rowText, style]}>{text}</Animated.Text>
    </Pressable>
  );
}

// CSS scroll-snap for react-native-web (these keys pass straight through to CSS).
const webSnap = { scrollSnapType: 'y mandatory', outlineStyle: 'none' };
const webSnapRow = { scrollSnapAlign: 'center' };

const styles = StyleSheet.create({
  column: { height: WHEEL_ROW * VISIBLE_ROWS, overflow: 'hidden', borderRadius: radius.md },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: WHEEL_ROW,
    borderRadius: radius.md,
    backgroundColor: night.coralSoft,
  },
  row: { height: WHEEL_ROW, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: font.title, fontWeight: '800', color: night.text, fontVariant: ['tabular-nums'] },
});
