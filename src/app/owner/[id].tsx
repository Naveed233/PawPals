import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
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
import { SEED_OWNER_PROFILES, type BiText } from '@/data/owners';
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
 * Owner profile — the human behind the dogs, built to make meeting feel safe:
 * social proof (tenure, events, verification), a voice-y bio, prompt cards
 * that invite a first message, shared ground with the viewer, and safety
 * guidance. Visible only to matches (or yourself); locked otherwise.
 */
export default function OwnerDetail() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)');
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, tx, tv } = useI18n();

  const me = useStore((s) => s.owner);
  const myDogs = useStore((s) => s.dogs);
  const matches = useStore((s) => s.matches);

  const pick = (t: BiText) => (lang === 'ja' ? t.ja : t.en);

  const isSelf = !!me && (id === me.id || id === 'me');
  const seedDogs = SEED_DOGS.filter((d) => d.ownerId === id);
  const seedInfo = seedDogs[0];
  const rich = !isSelf && id ? SEED_OWNER_PROFILES[id] : undefined;

  const name = isSelf ? me!.firstName : (seedInfo?.ownerName ?? '');
  const area = isSelf ? me!.area : (seedInfo?.ownerArea ?? '');
  const verified = isSelf ? me!.verified : !!seedInfo?.ownerVerified;
  const ageRange = isSelf ? me!.ageRange : rich?.ageRange;
  const bio = isSelf ? me!.bio : rich ? pick(rich.bio) : '';
  const languages = isSelf ? me!.languages : (rich?.languages ?? []);
  const availability = isSelf ? me!.availability : (rich?.availability ?? []);
  const dogs = isSelf ? myDogs : seedDogs;
  const distanceKm = seedDogs.length
    ? Math.min(...seedDogs.map((d) => d.distanceKm))
    : null;
  const heroHeight = Math.round(windowHeight * 0.42);

  const isMatched = seedDogs.some((d) => matches.some((m) => m.dogId === d.id));
  // Demo (seed) owner profiles are viewable so the feature is discoverable;
  // real users' profiles stay private until you match (safety).
  const isSeedOwner = !!seedInfo;
  const canView = isSelf || isMatched || isSeedOwner;
  const matchedDog = seedDogs.find((d) => matches.some((m) => m.dogId === d.id));

  // Shared ground with the viewer — similarity is the fastest rapport builder.
  const sharedLangs = !isSelf && me ? languages.filter((l) => me.languages.includes(l)) : [];
  const sharedAvail = !isSelf && me
    ? availability.filter((a) => me.availability.includes(a))
    : [];
  const bothHaveDogs =
    !isSelf && myDogs.length > 0 && (me?.petStatus ?? 'has-dog') === 'has-dog';
  const hasShared = sharedLangs.length + sharedAvail.length > 0 || bothHaveDogs;

  if (!isSelf && !seedInfo) {
    return (
      <View style={[styles.page, styles.centerWrap, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar style="dark" />
        <Text style={styles.mutedCenter}>
          {tx('このプロフィールは表示できません。', "This profile can't be shown.")}
        </Text>
        <BackPill onPress={() => goBack()} label={tx('戻る', 'Back')} />
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
            'Owner profiles are only visible after your dogs match with each other.',
          )}
        </Text>
        <BackPill onPress={() => goBack()} label={tx('戻る', 'Back')} />
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
              {!!ageRange && <Text style={styles.age}>　{ageRange}</Text>}
            </Text>
            {verified && <VerifiedBadge />}
          </View>
          <View style={styles.areaRow}>
            <Icon name="pin" color={pastel.mutedInk} size={15} />
            <Text style={styles.areaText}>
              {area}
              {distanceKm != null && !isSelf
                ? tx(`・約${distanceKm}km先`, ` · about ${distanceKm} km away`)
                : ''}
            </Text>
          </View>

          {/* Trust row: tenure · events · verification */}
          {(rich || isSelf) && (
            <View style={styles.trustRow}>
              {rich && (
                <View style={styles.trustTile}>
                  <Text style={styles.trustValue}>{pick(rich.memberSince)}</Text>
                  <Text style={styles.trustLabel}>{tx('メンバー歴', 'Member')}</Text>
                </View>
              )}
              {rich && (
                <View style={styles.trustTile}>
                  <Text style={styles.trustValue}>
                    {tx(`${rich.eventsJoined}回`, `${rich.eventsJoined}×`)}
                  </Text>
                  <Text style={styles.trustLabel}>{tx('イベント参加', 'Events joined')}</Text>
                </View>
              )}
              <View style={styles.trustTile}>
                <Text style={styles.trustValue}>{verified ? '✓' : '—'}</Text>
                <Text style={styles.trustLabel}>
                  {verified ? tx('本人確認済み', 'ID verified') : tx('未認証', 'Not verified')}
                </Text>
              </View>
              {isSelf && (
                <View style={styles.trustTile}>
                  <Text style={styles.trustValue}>🐾</Text>
                  <Text style={styles.trustLabel}>
                    {tx(
                      JP_PET_STATUS[me!.petStatus ?? 'has-dog'],
                      EN_PET_STATUS[me!.petStatus ?? 'has-dog'],
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bio */}
          {!!bio && <Text style={styles.bio}>{bio}</Text>}

          {/* Shared ground with the viewer */}
          {hasShared && (
            <>
              <Text style={styles.sectionHeader}>
                {tx('あなたとの共通点', 'What you two share')}
              </Text>
              <View style={styles.chipRow}>
                {bothHaveDogs && (
                  <View style={[styles.chip, { backgroundColor: pastel.mint }]}>
                    <Text style={[styles.chipText, { color: pastel.mintText }]}>
                      {tx('🐾 犬好き同士', '🐾 Both dog people')}
                    </Text>
                  </View>
                )}
                {sharedLangs.map((l) => (
                  <View key={l} style={[styles.chip, { backgroundColor: pastel.mint }]}>
                    <Text style={[styles.chipText, { color: pastel.mintText }]}>
                      {tx(`✓ ${tv(JP_LANGUAGE, l)}で話せる`, `✓ You both speak ${l}`)}
                    </Text>
                  </View>
                ))}
                {sharedAvail.map((a) => (
                  <View key={a} style={[styles.chip, { backgroundColor: pastel.mint }]}>
                    <Text style={[styles.chipText, { color: pastel.mintText }]}>
                      {tx(`✓ ${tv(JP_AVAILABILITY, a)}が空いてる`, `✓ Both free ${a.toLowerCase()}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Prompt cards — the conversation starters */}
          {rich?.prompts.map((p, i) => (
            <View
              key={i}
              style={[
                styles.promptCard,
                { backgroundColor: i % 2 === 0 ? pastel.lavender : pastel.butter },
              ]}
            >
              <Text
                style={[
                  styles.promptQ,
                  { color: i % 2 === 0 ? pastel.lavenderText : pastel.butterText },
                ]}
              >
                {pick(p.q)}
              </Text>
              <Text style={styles.promptA}>{pick(p.a)}</Text>
            </View>
          ))}

          {/* Languages & availability */}
          {(languages.length > 0 || availability.length > 0) && (
            <View style={styles.chipRow}>
              {languages.map((l) => (
                <View key={l} style={[styles.chip, { backgroundColor: pastel.butter }]}>
                  <Text style={[styles.chipText, { color: pastel.butterText }]}>
                    {tv(JP_LANGUAGE, l)}
                  </Text>
                </View>
              ))}
              {availability.map((a) => (
                <View key={a} style={[styles.chip, { backgroundColor: pastel.lavender }]}>
                  <Text style={[styles.chipText, { color: pastel.lavenderText }]}>
                    {tv(JP_AVAILABILITY, a)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Looking for (seed: from their dog's intents) */}
          {!isSelf && seedInfo && seedInfo.intents.length > 0 && (
            <View style={styles.chipRow}>
              {seedInfo.intents.map((it) => (
                <View key={it} style={[styles.chip, styles.chipOutline]}>
                  <Text style={[styles.chipText, { color: pastel.mutedInk }]}>
                    {tv(JP_INTENT, it)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Pets */}
          {dogs.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>
                {isSelf
                  ? tx('あなたのペット', 'Your pets')
                  : tx(`${name}さんのペット`, `${name}'s pets`)}
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

          {/* Safety guidance — trust through transparency */}
          {!isSelf && (
            <View style={styles.safetyCard}>
              <Text style={styles.safetyTitle}>
                {tx('🛡️ はじめて会うときは', '🛡️ Meeting for the first time')}
              </Text>
              <Text style={styles.safetyText}>
                {tx(
                  '犬同伴OKの公共の場所で、明るい時間帯に。行き先を友人に伝えておくと安心です。',
                  'Pick a public, dog-friendly spot in daylight — and let a friend know where you are.',
                )}
              </Text>
            </View>
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

      {/* Message CTA for matched owners */}
      {!isSelf && matchedDog && (
        <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            onPress={() => router.push(`/chat/${matchedDog.id}`)}
            accessibilityRole="button"
            accessibilityLabel={tx(
              `${name}さんにメッセージを送る`,
              `Send ${name} a message`,
            )}
            style={({ pressed }) => [styles.ctaBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <Icon name="chat" color="#fff" size={18} />
            <Text style={styles.ctaText}>{tx('メッセージを送る', 'Send a message')}</Text>
          </Pressable>
        </View>
      )}

      {/* Floating back button */}
      <View style={[styles.floatRow, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={() => goBack()}
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
    minHeight: 480,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  name: { fontSize: font.display, fontWeight: '900', color: pastel.ink },
  age: { fontSize: font.title, fontWeight: '700', color: pastel.mutedInk },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.sm },
  areaText: { fontSize: font.small, color: pastel.mutedInk, fontWeight: '700' },

  trustRow: { flexDirection: 'row', gap: spacing.sm },
  trustTile: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  trustValue: { fontSize: font.body, fontWeight: '900', color: pastel.ink, textAlign: 'center' },
  trustLabel: { fontSize: 10, fontWeight: '700', color: pastel.mutedInk, textAlign: 'center' },

  bio: { fontSize: font.body, color: pastel.ink, lineHeight: 23 },

  sectionHeader: {
    fontSize: font.small,
    fontWeight: '800',
    color: pastel.mutedInk,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipOutline: { borderWidth: 1.5, borderColor: pastel.dashed, backgroundColor: 'transparent' },
  chipText: { fontSize: font.small, fontWeight: '700' },

  promptCard: { borderRadius: 20, padding: spacing.lg, gap: spacing.sm },
  promptQ: {
    fontSize: font.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptA: { fontSize: font.heading, fontWeight: '700', color: pastel.ink, lineHeight: 26 },

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

  safetyCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: pastel.dashed,
  },
  safetyTitle: { fontSize: font.small, fontWeight: '800', color: pastel.ink },
  safetyText: { fontSize: font.small, color: pastel.mutedInk, lineHeight: 20 },

  selfNote: { fontSize: font.tiny, color: pastel.mutedInk, textAlign: 'center', lineHeight: 16 },

  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: pastel.ink,
    borderRadius: radius.pill,
    height: 54,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: font.body },

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
