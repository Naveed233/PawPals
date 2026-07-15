import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { VerifiedBadge } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { useI18n } from '@/lib/i18n';
import {
  EN_PET_STATUS,
  JP_AVAILABILITY,
  JP_INTENT,
  JP_LANGUAGE,
  JP_PET_STATUS,
} from '@/lib/jp';
import { useStore } from '@/store';
import { font, pastel, radius, spacing } from '@/theme';

/**
 * Owner profile — the human behind the dogs. Same pastel, full-screen-photo
 * treatment as the pet page. Privacy rule: another owner's profile is only
 * visible once you've matched with one of their dogs (your own is always
 * visible to you, so you can see exactly what matches will see).
 */
export default function OwnerDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tx, tv } = useI18n();

  const me = useStore((s) => s.owner);
  const myDogs = useStore((s) => s.dogs);
  const matches = useStore((s) => s.matches);

  const isSelf = !!me && (id === me.id || id === 'me');

  // Seed owners are derived from their dogs (the owner is supporting info).
  const seedDogs = SEED_DOGS.filter((d) => d.ownerId === id);
  const seedInfo = seedDogs[0];

  const name = isSelf ? me!.firstName : (seedInfo?.ownerName ?? '');
  const area = isSelf ? me!.area : (seedInfo?.ownerArea ?? '');
  const verified = isSelf ? me!.verified : !!seedInfo?.ownerVerified;
  const dogs = isSelf ? myDogs : seedDogs;
  const heroHeight = Math.round(windowHeight * 0.42);

  const isMatched = seedDogs.some((d) => matches.some((m) => m.dogId === d.id));
  const canView = isSelf || isMatched;

  if (!isSelf && !seedInfo) {
    return (
      <View style={[styles.page, styles.centerWrap, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar style="dark" />
        <Text style={styles.mutedCenter}>
          {tx('このプロフィールは表示できません。', "This profile can't be shown.")}
        </Text>
        <BackPill onPress={() => router.back()} label={tx('戻る', 'Back')} />
      </View>
    );
  }

  if (!canView) {
    return (
      <View style={[styles.page, styles.centerWrap, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar style="dark" />
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.lockTitle}>
          {tx('マッチするとプロフィールが見られます', 'Match to see this profile')}
        </Text>
        <Text style={styles.mutedCenter}>
          {tx(
            '飼い主のプロフィールは、お互いのワンちゃんがマッチした後にのみ表示されます。',
            "Owner profiles are only visible after your dogs match with each other.",
          )}
        </Text>
        <BackPill onPress={() => router.back()} label={tx('戻る', 'Back')} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
      >
        {/* Hero: full-width portrait */}
        <View style={{ height: heroHeight }}>
          <OwnerAvatar
            ownerId={isSelf ? (me!.id ?? 'me') : id!}
            name={name}
            uri={isSelf ? me!.photo : undefined}
            style={{ width: '100%', height: heroHeight }}
            size={120}
          />
          <LinearGradient
            colors={['rgba(235,197,172,0)', 'rgba(235,197,172,0.55)']}
            style={styles.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* Sheet */}
        <View style={styles.sheet}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            {verified && <VerifiedBadge />}
          </View>
          <View style={styles.areaRow}>
            <Icon name="pin" color={pastel.mutedInk} size={15} />
            <Text style={styles.areaText}>{area}</Text>
          </View>

          {isSelf && !!me!.bio && <Text style={styles.bio}>{me!.bio}</Text>}

          {isSelf && (
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: pastel.lavender }]}>
                <Text style={[styles.chipText, { color: pastel.lavenderText }]}>
                  🐾 {tx(
                    JP_PET_STATUS[me!.petStatus ?? 'has-dog'],
                    EN_PET_STATUS[me!.petStatus ?? 'has-dog'],
                  )}
                </Text>
              </View>
              {me!.languages.map((l) => (
                <View key={l} style={[styles.chip, { backgroundColor: pastel.butter }]}>
                  <Text style={[styles.chipText, { color: pastel.butterText }]}>
                    {tv(JP_LANGUAGE, l)}
                  </Text>
                </View>
              ))}
              {me!.availability.map((a) => (
                <View key={a} style={[styles.chip, { backgroundColor: pastel.mint }]}>
                  <Text style={[styles.chipText, { color: pastel.mintText }]}>
                    {tv(JP_AVAILABILITY, a)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!isSelf && seedInfo && seedInfo.intents.length > 0 && (
            <View style={styles.chipRow}>
              {seedInfo.intents.map((it) => (
                <View key={it} style={[styles.chip, { backgroundColor: pastel.lavender }]}>
                  <Text style={[styles.chipText, { color: pastel.lavenderText }]}>
                    {tv(JP_INTENT, it)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {dogs.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>
                {isSelf ? tx('あなたのペット', 'Your pets') : tx(`${name}さんのペット`, `${name}'s pets`)}
              </Text>
              <View style={styles.dogRow}>
                {dogs.map((dog) => (
                  <Pressable
                    key={dog.id}
                    onPress={() => router.push(`/dog/${dog.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={tx(
                      `${dog.name}のプロフィールを開く`,
                      `Open ${dog.name}'s profile`,
                    )}
                    style={({ pressed }) => [styles.dogCard, pressed && { opacity: 0.85 }]}
                  >
                    <DogPhoto dog={dog} style={styles.dogPhoto} rounded={16} emojiSize={40} />
                    <Text style={styles.dogName} numberOfLines={1}>
                      {dog.name}
                    </Text>
                    <Text style={styles.dogBreed} numberOfLines={1}>
                      {dog.breed}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {isSelf && (
            <Text style={styles.selfNote}>
              {tx(
                'これは、マッチした相手に表示されるあなたのプロフィールです。',
                'This is your profile exactly as your matches see it.',
              )}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Floating back button */}
      <View style={[styles.floatRow, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={tx('戻る', 'Back')}
          hitSlop={8}
          style={({ pressed }) => [styles.floatBtn, pressed && { opacity: 0.7 }]}
        >
          <Icon name="arrowLeft" color={pastel.ink} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function BackPill({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.backPill, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.backPillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pastel.hero },
  centerWrap: { alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  mutedCenter: {
    fontSize: font.body,
    color: pastel.mutedInk,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  lockEmoji: { fontSize: 44, marginTop: spacing.xxl },
  lockTitle: { fontSize: font.title, fontWeight: '900', color: pastel.ink, textAlign: 'center' },
  backPill: {
    backgroundColor: pastel.sheet,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  backPillText: { fontWeight: '800', color: pastel.ink },

  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },

  sheet: {
    backgroundColor: pastel.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: spacing.xl,
    gap: spacing.lg,
    minHeight: 420,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  name: { fontSize: font.display, fontWeight: '900', color: pastel.ink },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.sm },
  areaText: { fontSize: font.small, color: pastel.mutedInk, fontWeight: '700' },
  bio: { fontSize: font.body, color: pastel.ink, lineHeight: 22 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText: { fontSize: font.small, fontWeight: '700' },

  sectionHeader: {
    fontSize: font.small,
    fontWeight: '800',
    color: pastel.mutedInk,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dogRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  dogCard: {
    width: 128,
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  dogPhoto: { width: 112, height: 96 },
  dogName: { fontSize: font.body, fontWeight: '800', color: pastel.ink },
  dogBreed: { fontSize: font.tiny, color: pastel.mutedInk },

  selfNote: { fontSize: font.tiny, color: pastel.mutedInk, textAlign: 'center', lineHeight: 16 },

  floatRow: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row' },
  floatBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: pastel.sheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
