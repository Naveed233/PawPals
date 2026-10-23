import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Entrance } from '@/components/anim';
import { Icon } from '@/components/icons';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useI18n } from '@/lib/i18n';
import { font, night, radius, shadow, spacing, tone } from '@/theme';

/*
 * Welcome / first screen — the album's cover page.
 *
 * The park photo (assets/images/welcome-bg.jpg) as a large instant print on the
 * sky ground, the wordmark and headline in ink, and one action button. Swap the
 * photo by replacing that file; the print crops to its lower part, where the
 * dogs are.
 *
 * Sizes come from percentages and an aspect ratio, never from window
 * dimensions at render: this page is pre-rendered at build time (window size
 * 0), and those first styles survive hydration on the web.
 */

const PHOTO = require('@/assets/images/welcome-bg.jpg');

export default function Welcome() {
  const router = useRouter();
  const { tx } = useI18n();

  return (
    <View style={styles.root}>
      <LinearGradient colors={[night.bgTop, night.bg]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <View style={styles.topBar}>
            <Entrance delay={0} style={styles.brand}>
              <View style={styles.mark}>
                <Icon name="pawFill" color={tone.onAction} size={18} />
              </View>
              <Text style={styles.logo}>PawPair</Text>
            </Entrance>
            <LanguageToggle />
          </View>

          {/* Print and words are one block centred in the free height, so tall
              phones share the extra space above and below instead of one gap. */}
          <View style={styles.cover}>
            <View style={styles.printArea}>
              <Entrance delay={120} style={styles.printSlot}>
                <View style={styles.print}>
                  <Image
                    source={PHOTO}
                    style={styles.photo}
                    contentFit="cover"
                    contentPosition="bottom"
                    accessibilityLabel={tx('公園を走る2匹の犬', 'Two dogs running in a park')}
                  />
                </View>
              </Entrance>
            </View>

            <Entrance delay={260}>
              <Text style={styles.headline} accessibilityRole="header">
                {tx('愛犬の、新しい親友を\n見つけよう。', "Find your dog's new best friend.")}
              </Text>
            </Entrance>

            <Entrance delay={380}>
              <Text style={styles.sub}>
                {tx(
                  '近くのワンちゃんとつながろう。お散歩やプレイデート、新しい出会いを。',
                  'Connect with pups nearby — walks, playdates, and brand-new friendships.',
                )}
              </Text>
            </Entrance>
          </View>

          <Entrance delay={500}>
            <AnimatedPressable
              onPress={() => router.push('/sign-in')}
              accessibilityLabel={tx('はじめる', 'Get started')}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>
                {tx('無料で試す', 'Try Free')}
              </Text>
            </AnimatedPressable>
          </Entrance>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.bg },
  safe: { flex: 1 },
  body: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: night.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3, color: tone.ink },

  // The cover print: white frame, photo inset, the thick bottom margin of a
  // cheki, slightly turned.
  cover: { flex: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  printArea: { alignItems: 'center', marginBottom: spacing.xl },
  printSlot: { width: '86%', maxWidth: 340 },
  print: {
    backgroundColor: tone.print,
    borderRadius: radius.print,
    padding: 12,
    paddingBottom: 44,
    transform: [{ rotate: '-2deg' }],
    ...shadow.print,
  },
  photo: { width: '100%', aspectRatio: 1.05, borderRadius: 3, backgroundColor: tone.input },

  headline: {
    fontSize: 28,
    lineHeight: 39,
    fontWeight: '900',
    color: tone.ink,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: font.body,
    lineHeight: 24,
    fontWeight: '600',
    color: tone.inkMuted,
    marginTop: spacing.md,
  },

  cta: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: night.coral,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  ctaText: { color: night.onAction, fontWeight: '800', fontSize: 20 },
});
