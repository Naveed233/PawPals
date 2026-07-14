import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ImageBackground, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Entrance } from '@/components/anim';
import { colors, font, radius, shadow, spacing } from '@/theme';

/*
 * Welcome / first screen — poster-style hero.
 *
 * Full-bleed park photo (assets/images/welcome-bg.jpg) under a warm scrim,
 * cream Japanese headline, and a single green CTA. Swap the photo by
 * replacing that file; keep it portrait (~9:16) so the crop stays nice.
 */

const BG = require('@/assets/images/welcome-bg.jpg');

const CREAM = '#F3E3C2';

export default function Welcome() {
  const router = useRouter();
  // Scale type/spacing down on short screens (e.g. iPhone SE) so the whole
  // screen fits without scrolling.
  const { height } = useWindowDimensions();
  const compact = height < 740;

  return (
    <ImageBackground
      source={BG}
      style={styles.bg}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(28,20,10,0.55)', 'rgba(28,20,10,0.12)', 'rgba(18,14,8,0.45)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <View style={[styles.body, compact && styles.bodyCompact]}>
          <Entrance delay={0}>
            <Text style={styles.logo}>PawPair</Text>
          </Entrance>

          <Entrance delay={150}>
            <Text style={[styles.headline, compact && styles.headlineCompact]}>
              愛犬の、新しい親友を見つけよう。
            </Text>
          </Entrance>

          <Entrance delay={300}>
            <Text style={[styles.sub, compact && styles.subCompact]}>
              近くのワンちゃんとつながろう。お散歩やプレイデート、新しい出会いを。
            </Text>
          </Entrance>

          <View style={{ flex: 1 }} />

          <Entrance delay={500} style={styles.ctaWrap}>
            <AnimatedPressable
              onPress={() => router.push('/sign-in')}
              accessibilityLabel="Get started"
              style={[styles.cta, compact && styles.ctaCompact]}
            >
              <Text style={[styles.ctaText, compact && styles.ctaTextCompact]}>Download Free</Text>
            </AnimatedPressable>
          </Entrance>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', backgroundColor: '#3a2c1c' },
  bgImage: { width: '100%', height: '100%' },
  safe: { flex: 1 },
  body: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  bodyCompact: { paddingTop: spacing.lg, paddingBottom: spacing.lg },

  logo: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: CREAM,
  },
  headline: {
    fontSize: 36,
    lineHeight: 50,
    fontWeight: '600',
    color: CREAM,
    marginTop: spacing.xl,
    paddingRight: spacing.xxl,
  },
  headlineCompact: {
    fontSize: 28,
    lineHeight: 39,
    marginTop: spacing.lg,
  },
  sub: {
    fontSize: font.body,
    lineHeight: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.xl,
    paddingRight: spacing.xxl,
  },
  subCompact: {
    fontSize: font.small,
    lineHeight: 20,
    marginTop: spacing.md,
  },

  ctaWrap: { alignItems: 'center' },
  cta: {
    minWidth: 300,
    maxWidth: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  ctaCompact: { minWidth: 260, paddingVertical: spacing.md },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 26 },
  ctaTextCompact: { fontSize: 21 },
});
