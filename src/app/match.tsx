import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { dogById } from '@/lib/dogs';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/store';
import { font, radius, shadow, spacing, tone } from '@/theme';
import type { DogProfile } from '@/types';

/**
 * An instant print that "develops": the photo starts milky, cool and blurred,
 * and clears to full colour and focus, the one authored motion moment in the
 * app. Reduced motion shows the developed print straight away. (The blur runs
 * on web and Android; iOS has no view blur filter, so there only the milk fades.)
 */
function DevelopingPrint({ dog, delay, tilt }: { dog: DogProfile; delay: number; tilt: string }) {
  const reduce = useReducedMotion();
  const milk = useSharedValue(reduce ? 0 : 1);
  useEffect(() => {
    if (reduce) return;
    milk.set(withDelay(delay, withTiming(0, { duration: 1600, easing: Easing.out(Easing.exp) })));
  }, [delay, milk, reduce]);
  const milkStyle = useAnimatedStyle(() => ({ opacity: milk.get() }));
  const focusStyle = useAnimatedStyle(() => ({ filter: `blur(${(milk.get() * 6).toFixed(2)}px)` }));

  return (
    <View style={[styles.print, { transform: [{ rotate: tilt }] }]}>
      <View style={styles.printPhoto}>
        <Animated.View style={[StyleSheet.absoluteFill, focusStyle]}>
          <DogPhoto dog={dog} style={StyleSheet.absoluteFill} emojiSize={52} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.milk, milkStyle]} pointerEvents="none" />
      </View>
      <Text style={styles.printCaption} numberOfLines={1}>
        {dog.name}
      </Text>
    </View>
  );
}

export default function MatchCelebration() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)');
  const { tx } = useI18n();
  const { dogId } = useLocalSearchParams<{ dogId: string }>();
  const myDog = useStore((s) => s.dogs[0]);
  const dog = dogById(dogId);

  const close = () => goBack();

  // Edge case: the matched dog couldn't be resolved. Show a dismissible state
  // rather than navigating during render (which would warn / risk a loop).
  // (A missing OWN dog is fine — pet-less users can match too.)
  if (!dog) {
    return (
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel={tx('閉じる', 'Close')}
        />
        <Text style={styles.title}>{tx('このマッチは表示できません', "This match can't be shown")}</Text>
        <Button label={tx('閉じる', 'Close')} variant="outline" onPress={close} style={styles.wide} />
      </View>
    );
  }

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={close}
        accessibilityLabel={tx('閉じる', 'Close')}
      />
      <View style={styles.content} pointerEvents="box-none">
        <Text style={styles.title} accessibilityRole="header">
          {tx('マッチしました！', "It's a match!")}
        </Text>
        <Text style={styles.lead}>
          {myDog
            ? tx(
                `${myDog.name}と${dog.name}、お互いに会いたがっています`,
                `${myDog.name} and ${dog.name} want to meet each other`,
              )
            : tx(`${dog.name}とマッチしました`, `You matched with ${dog.name}`)}
        </Text>

        <View style={styles.prints} pointerEvents="none">
          {myDog && <DevelopingPrint dog={myDog} delay={200} tilt="-6deg" />}
          <View style={myDog ? styles.overlap : null}>
            <DevelopingPrint dog={dog} delay={myDog ? 650 : 200} tilt={myDog ? '5deg' : '-2deg'} />
          </View>
          <View style={styles.paw}>
            <Icon name="pawFill" color={tone.onReward} size={24} />
          </View>
        </View>

        <Text style={styles.body}>
          {tx(
            `${dog.ownerName}さんとミートアップの計画を立てられます。\n初めて会うときは、必ず犬同伴OKの公共の場所で。`,
            `You can now plan a meetup with ${dog.ownerName}.\nFor a first meeting, always pick a public, dog-friendly spot.`,
          )}
        </Text>

        <View style={styles.wide}>
          <Button
            label={tx('メッセージを送る', 'Send a message')}
            onPress={() => {
              close();
              router.push(`/chat/${dog.id}`);
            }}
          />
          <Button
            label={tx(`${dog.name}のプロフィールを見る`, `View ${dog.name}'s profile`)}
            variant="outline"
            onPress={() => {
              close();
              router.push(`/dog/${dog.id}`);
            }}
          />
          <Button label={tx('スワイプを続ける', 'Keep swiping')} variant="ghost" onPress={close} />
        </View>
      </View>
    </View>
  );
}

const PRINT_W = 148;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: tone.skyScrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  content: { width: '100%', maxWidth: 380, alignItems: 'center', gap: spacing.md },
  title: { fontSize: 32, fontWeight: '900', color: tone.ink, textAlign: 'center', letterSpacing: -0.5 },
  lead: { fontSize: font.body, fontWeight: '700', color: tone.ink, textAlign: 'center' },

  prints: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  overlap: { marginLeft: -26, marginTop: 18 },
  print: {
    width: PRINT_W,
    backgroundColor: tone.print,
    borderRadius: radius.print,
    padding: 9,
    paddingBottom: 0,
    ...shadow.print,
  },
  printPhoto: { height: PRINT_W * 1.12, borderRadius: 3, overflow: 'hidden', backgroundColor: tone.input },
  // Undeveloped instant film: a cool, milky grey-blue.
  milk: { backgroundColor: '#D6DEE8' },
  printCaption: {
    fontSize: font.body,
    fontWeight: '900',
    color: tone.ink,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  paw: {
    position: 'absolute',
    bottom: -18,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: tone.reward,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },

  body: { fontSize: font.small, color: tone.inkMuted, textAlign: 'center', lineHeight: 20 },
  wide: { width: '100%', maxWidth: 380, gap: spacing.sm, marginTop: spacing.sm },
});
