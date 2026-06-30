import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable, Entrance, Pop } from '@/components/anim';
import { colors, font, radius, shadow, spacing } from '@/theme';

/*
 * Welcome / first screen.
 *
 * To use your own hero illustration (e.g. the attached couple-and-dog image):
 *   1. Save it to  assets/images/welcome-hero.png
 *   2. Replace <AnimatedHero /> below with:
 *        <Image source={require('@/assets/images/welcome-hero.png')}
 *               style={styles.heroImg} contentFit="contain" />
 *      (import { Image } from 'expo-image')
 * Until then we show an animated branded hero so nothing is broken.
 */

const FEATURES = ['🐾 Playdates', '🚶 Walks', '☕ Meetups', '🎉 Events', '💛 Dating'];

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Pop style={styles.heroWrap}>
          <AnimatedHero />
        </Pop>

        <Entrance delay={150}>
          <Text style={styles.brand}>PawPair</Text>
        </Entrance>
        <Entrance delay={280}>
          <Text style={styles.tagline}>
            Where dogs make friends — and so do their humans. Find playdates, walks, meetups,
            events, and maybe a little romance.
          </Text>
        </Entrance>

        <View style={styles.featureRow}>
          {FEATURES.map((f, i) => (
            <Entrance key={f} delay={420 + i * 70} style={styles.pill}>
              <Text style={styles.pillText}>{f}</Text>
            </Entrance>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Entrance delay={800} style={{ gap: spacing.md }}>
          <AnimatedPressable
            onPress={() => router.push('/sign-in')}
            accessibilityLabel="Get started"
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Get started</Text>
          </AnimatedPressable>
          <Text style={styles.fine}>
            A dog friendship & meetup app — not a human-only dating app. Always meet in public.
          </Text>
        </Entrance>
      </View>
    </SafeAreaView>
  );
}

function AnimatedHero() {
  return (
    <LinearGradient colors={[colors.blueSoft, colors.forestSoft]} style={styles.hero}>
      <Floaty emoji="✨" size={26} delay={0} left="14%" top="18%" range={12} />
      <Floaty emoji="💛" size={22} delay={300} left="78%" top="22%" range={14} />
      <Floaty emoji="🩷" size={20} delay={600} left="22%" top="64%" range={10} />
      <Floaty emoji="✨" size={18} delay={900} left="80%" top="62%" range={12} />
      <Bobbing>
        <Text style={styles.heroPaw}>🐾</Text>
      </Bobbing>
    </LinearGradient>
  );
}

function Bobbing({ children }: { children: React.ReactNode }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * t.value }, { scale: 1 + 0.03 * t.value }] }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

function Floaty({
  emoji,
  size,
  delay,
  left,
  top,
  range,
}: {
  emoji: string;
  size: number;
  delay: number;
  left: string;
  top: string;
  range: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [t, delay]);
  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: -range * t.value }],
    opacity: 0.55 + 0.45 * t.value,
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', left: left as any, top: top as any, fontSize: size }, s]}>
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  body: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxl },
  heroWrap: { alignItems: 'center' },
  hero: {
    width: '100%',
    height: 280,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  heroImg: { width: '100%', height: 280 },
  heroPaw: { fontSize: 120 },

  brand: { fontSize: 44, fontWeight: '900', color: colors.forest, textAlign: 'center', marginTop: spacing.xl },
  tagline: {
    fontSize: font.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillText: { fontSize: font.small, fontWeight: '700', color: colors.charcoal },

  cta: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: font.heading },
  fine: { fontSize: font.tiny, color: colors.faint, textAlign: 'center', lineHeight: 16 },
});
