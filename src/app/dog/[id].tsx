import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OwnerAvatar } from '@/components/Avatar';
import { PhotoView } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { VerifiedBadge } from '@/components/ui';
import { computeCompatibility } from '@/lib/compatibility';
import { dogById } from '@/lib/dogs';
import { useI18n } from '@/lib/i18n';
import { blockUser, reportContent } from '@/lib/remote';
import {
  JP_ENERGY,
  EN_GOOD_WITH,
  JP_GOOD_WITH,
  JP_INTENT,
  JP_MEETUP,
  JP_PERSONALITY,
  JP_PLAY_STYLE,
  JP_RECALL,
  JP_SEX,
  JP_SOCIAL,
} from '@/lib/jp';
import { displayPhotos } from '@/lib/photos';
import { useStore } from '@/store';
import { font, night, pastel, radius, shadow, spacing } from '@/theme';
import type { GoodWith } from '@/types';

/** Light pastel pet-profile page — the one intentionally NOT dark screen. */
export default function DogDetail() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)');
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, tx, tv } = useI18n();

  const myDog = useStore((s) => s.dogs[0]);
  const myDogs = useStore((s) => s.dogs);
  const saved = useStore((s) => s.saved);
  const deck = useStore((s) => s.deck);
  const toggleSave = useStore((s) => s.toggleSave);
  const swipe = useStore((s) => s.swipe);
  const matches = useStore((s) => s.matches);

  const dog = dogById(id);

  if (!dog) {
    return (
      <View style={[styles.page, styles.missingWrap, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar style="dark" />
        <Text style={styles.notFound}>
          {tx('このプロフィールは表示できません。', 'This profile isn’t available.')}
        </Text>
        <Pressable
          onPress={() => goBack()}
          accessibilityRole="button"
          accessibilityLabel={tx('戻る', 'Back')}
          style={styles.missingBack}
        >
          <Text style={styles.missingBackText}>{tx('戻る', 'Back')}</Text>
        </Pressable>
      </View>
    );
  }

  const isMine = myDogs.some((d) => d.id === dog.id);
  const compat = myDog && !isMine ? computeCompatibility(myDog, dog, lang) : null;
  const inDeck = (deck ?? []).includes(dog.id);
  const isSaved = saved.includes(dog.id);
  const isMatched = matches.some((m) => m.dogId === dog.id);

  const like = () => {
    const match = swipe(dog.id, 'like');
    goBack();
    if (match) router.push({ pathname: '/match', params: { dogId: dog.id } });
  };

  // Block + report both persist server-side (blocked_users / reports tables).
  // Blocking a demo/seed owner is a no-op server-side but still removes them
  // from the deck locally so the control always does something visible.
  const doBlock = async () => {
    await Promise.all([
      blockUser(dog.ownerId),
      reportContent(dog.ownerId, dog.id, 'Blocked from profile'),
    ]);
    if (inDeck) swipe(dog.id, 'pass');
    goBack();
  };

  const doReport = async () => {
    await reportContent(dog.ownerId, dog.id, 'Reported from profile');
    const msg = tx(
      'ご報告ありがとうございます。モデレーションチームが確認します。',
      'Thanks for the report. Our moderation team will review it.',
    );
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert(tx('ありがとうございます', 'Thank you'), msg);
  };

  const report = () => {
    const title = tx('通報・ブロック', 'Report or block');
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      const choice = window.confirm(
        tx(
          `${dog.name}さんの飼い主をブロックしますか？（今後表示されず、メッセージも送受信できません）\n「キャンセル」を選ぶと通報のみ行います。`,
          `Block ${dog.name}'s owner? They won't appear again and can't message you.\nChoose Cancel to only report.`,
        ),
      );
      if (choice) void doBlock();
      else void doReport();
      return;
    }
    Alert.alert(
      title,
      tx(
        `${dog.name}のプロフィールについて、どうしますか？`,
        `What would you like to do about ${dog.name}’s profile?`,
      ),
      [
        { text: tx('キャンセル', 'Cancel'), style: 'cancel' },
        { text: tx('プロフィールを通報', 'Report profile'), onPress: () => void doReport() },
        {
          text: tx('ブロック', 'Block'),
          style: 'destructive',
          onPress: () => void doBlock(),
        },
      ],
    );
  };

  const hero = displayPhotos(dog, 1)[0];
  const heroHeight = Math.round(windowHeight * 0.45);

  const goodWithEntries = Object.keys(JP_GOOD_WITH) as (keyof GoodWith)[];
  const chipTones = [
    { bg: pastel.lavender, fg: pastel.lavenderText },
    { bg: pastel.butter, fg: pastel.butterText },
    { bg: pastel.mint, fg: pastel.mintText },
  ];

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      >
        {/* ------------------------------------------------------------ Hero */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <PhotoView
            photo={hero}
            seed={dog.id}
            name={dog.name}
            style={[styles.heroPhoto, { height: heroHeight }]}
            emojiSize={110}
          />
          <LinearGradient
            colors={['rgba(235,197,172,0)', 'rgba(235,197,172,0.55)']}
            style={styles.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* ----------------------------------------------------------- Sheet */}
        <View style={styles.sheet}>
          <Text style={styles.name} numberOfLines={2}>
            {dog.name}
          </Text>
          <View style={styles.distanceRow}>
            <Icon name="pin" color={pastel.mutedInk} size={15} />
            <Text style={styles.distanceText}>
              {tx(`${dog.distanceKm} km 先`, `${dog.distanceKm} km away`)}
            </Text>
          </View>

          {/* stat chips */}
          <View style={styles.statRow}>
            <StatChip bg={pastel.lavender} fg={pastel.lavenderText} value={tv(JP_SEX, dog.sex)} label={tx('性別', 'Sex')} />
            <StatChip bg={pastel.butter} fg={pastel.butterText} value={tx(`${dog.ageYears}歳`, `${dog.ageYears} yrs`)} label={tx('年齢', 'Age')} />
            <StatChip bg={pastel.mint} fg={pastel.mintText} value={dog.breed} label={tx('犬種', 'Breed')} />
          </View>

          {/* about card */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>{tx(`${dog.name}について`, `About ${dog.name}`)}</Text>
            {!!dog.notes && <Text style={styles.aboutBody}>{dog.notes}</Text>}
            <View style={styles.tagRow}>
              {[...dog.personality.map((t) => tv(JP_PERSONALITY, t)), ...dog.playStyle.map((t) => tv(JP_PLAY_STYLE, t))].map(
                (label, i) => {
                  const tone = chipTones[i % chipTones.length];
                  return (
                    <View key={`${label}-${i}`} style={[styles.miniChip, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.miniChipText, { color: tone.fg }]}>{label}</Text>
                    </View>
                  );
                },
              )}
            </View>
            {dog.intents.length > 0 && (
              <View style={styles.intentRow}>
                <Text style={styles.intentLabel}>{tx('目的：', 'Looking for:')}</Text>
                <View style={[styles.tagRow, { flex: 1 }]}>
                  {dog.intents.map((it) => (
                    <View key={it} style={[styles.miniChip, { backgroundColor: pastel.lavender }]}>
                      <Text style={[styles.miniChipText, { color: pastel.lavenderText }]}>{tv(JP_INTENT, it)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* compatibility / stats */}
          <Text style={styles.sectionHeader}>{tx('相性スコア', 'Compatibility')}</Text>
          <View style={styles.statsCard}>
            {compat ? (
              <>
                <View style={styles.scoreRow}>
                  <Text style={styles.scorePct}>{compat.score}%</Text>
                  <View style={{ flex: 1, gap: 6 }}>
                    {compat.reasons.map((r) => (
                      <View key={r} style={styles.reasonRow}>
                        <Icon name="check" color={night.pink} size={14} />
                        <Text style={styles.reasonText}>{r}</Text>
                      </View>
                    ))}
                    {compat.reasons.length === 0 && (
                      <Text style={styles.reasonText}>
                        {tx(
                          '共通点は少なめですが、会ってみる価値はあるかも。',
                          'Not a lot in common, but a meet-up could still be worth it.',
                        )}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.scoreNote}>
                  {tx(
                    'スコアは好みの一致度を示すものです。安全性やフレンドリーさを保証するものではありません。',
                    'The score shows how well preferences line up — it’s not a guarantee of safety or friendliness.',
                  )}
                </Text>
                <View style={styles.divider} />
              </>
            ) : null}

            <StatLine label={tx('エネルギー', 'Energy')} value={tv(JP_ENERGY, dog.energy)} />
            <StatLine label={tx('社交性', 'Social style')} value={tv(JP_SOCIAL, dog.social)} />
            <StatLine label={tx('呼び戻し', 'Recall')} value={tv(JP_RECALL, dog.recall)} />
            <StatLine label={tx('体重', 'Weight')} value={dog.weightKg ? `${dog.weightKg} kg` : '—'} />
            <StatLine label={tx('ワクチン接種', 'Vaccinated')} value={dog.vaccinated ? tx('済み', 'Yes') : tx('未', 'Not yet')} />
            <StatLine label={tx('去勢・避妊', 'Neutered')} value={dog.neutered ? tx('済み', 'Yes') : tx('未', 'Not yet')} />
            <StatLine label={tx('希望の会い方', 'Preferred meetup')} value={tv(JP_MEETUP, dog.meetupPref)} />

            <Text style={styles.goodWithLabel}>{tx('一緒に遊べる相手', 'Gets along with')}</Text>
            <View style={styles.tagRow}>
              {goodWithEntries.map((key) => {
                const ok = dog.goodWith[key];
                return (
                  <View
                    key={key}
                    style={[styles.miniChip, { backgroundColor: ok ? pastel.mint : '#F1EEE9' }]}
                  >
                    <Text style={[styles.miniChipText, { color: ok ? pastel.mintText : pastel.mutedInk }]}>
                      {ok ? '✓' : '✕'} {tx(JP_GOOD_WITH[key], EN_GOOD_WITH[key] ?? key)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {!!dog.avoid && (
            <View style={styles.warnCard}>
              <Text style={styles.warnTitle}>{tx('ご注意', 'Heads up')}</Text>
              <Text style={styles.warnText}>⚠️ {dog.avoid}</Text>
            </View>
          )}

          {/* owner strip — tap to open the owner's profile; stays private
              until a match */}
          {isMatched && (
            <Pressable
              onPress={() => router.push(`/owner/${dog.ownerId}`)}
              accessibilityRole="button"
              accessibilityLabel={tx(
                `${dog.ownerName}さんのプロフィールを開く`,
                `Open ${dog.ownerName}'s profile`,
              )}
              style={({ pressed }) => [styles.ownerStrip, pressed && { opacity: 0.75 }]}
            >
              <OwnerAvatar
                ownerId={dog.ownerId}
                name={dog.ownerName}
                style={styles.ownerAvatar}
                rounded={radius.pill}
                size={22}
              />
              <Text style={styles.ownerText} numberOfLines={1}>
                {tx(
                  `飼い主：${dog.ownerName}・${dog.ownerArea}`,
                  `Owner: ${dog.ownerName} · ${dog.ownerArea}`,
                )}
              </Text>
              {dog.ownerVerified && <VerifiedBadge />}
              <Icon name="chevronRight" color={pastel.mutedInk} size={18} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* -------------------------------------------- Floating header buttons */}
      <View style={[styles.floatRow, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={() => goBack()}
          accessibilityRole="button"
          accessibilityLabel={tx('戻る', 'Back')}
          hitSlop={8}
          style={({ pressed }) => [styles.floatBtn, pressed && styles.floatBtnPressed]}
        >
          <Icon name="arrowLeft" color={pastel.ink} size={20} />
        </Pressable>
        <View style={styles.floatRight}>
          {!isMine && (
            <Pressable
              onPress={report}
              accessibilityRole="button"
              accessibilityLabel={tx('通報・ブロック', 'Report or block')}
              hitSlop={8}
              style={({ pressed }) => [styles.floatBtn, pressed && styles.floatBtnPressed]}
            >
              <Icon name="dots" color={pastel.ink} size={20} />
            </Pressable>
          )}
          <Pressable
            onPress={() => toggleSave(dog.id)}
            accessibilityRole="button"
            accessibilityLabel={
              isSaved ? tx('保存を取り消す', 'Remove from saved') : tx('プロフィールを保存', 'Save profile')
            }
            accessibilityState={{ selected: isSaved }}
            hitSlop={8}
            style={({ pressed }) => [styles.floatBtn, pressed && styles.floatBtnPressed]}
          >
            <Icon name={isSaved ? 'heartFill' : 'heart'} color={isSaved ? night.pink : pastel.ink} size={20} />
          </Pressable>
        </View>
      </View>

      {/* -------------------------------------------------- Bottom action bar */}
      {!isMine && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {isMatched && (
            <>
              <Pressable
                onPress={() => router.push(`/call/${dog.id}`)}
                accessibilityRole="button"
                accessibilityLabel={tx('電話をかける', 'Start a call')}
                style={({ pressed }) => [styles.roundBtn, pressed && styles.floatBtnPressed]}
              >
                <Icon name="phone" color="#fff" size={20} />
              </Pressable>
              <Pressable
                onPress={() => router.push(`/chat/${dog.id}`)}
                accessibilityRole="button"
                accessibilityLabel={tx('チャットを開く', 'Open chat')}
                style={({ pressed }) => [styles.roundBtn, pressed && styles.floatBtnPressed]}
              >
                <Icon name="chat" color="#fff" size={20} />
              </Pressable>
            </>
          )}
          <Pressable
            onPress={isMatched ? () => router.push(`/chat/${dog.id}`) : like}
            disabled={!isMatched && !inDeck}
            accessibilityRole="button"
            accessibilityLabel={
              isMatched ? tx('マッチ済み。チャットを開く', 'Matched — open chat') : tx('会いたい！', 'Let’s meet!')
            }
            accessibilityState={{ disabled: !isMatched && !inDeck }}
            style={({ pressed }) => [
              styles.ctaPill,
              (!isMatched && !inDeck) && styles.ctaDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Icon name="pawFill" color="#fff" size={20} />
            <Text style={styles.ctaText}>
              {isMatched ? tx('マッチ済み ✓', 'Matched ✓') : tx('会いたい！', 'Let’s meet!')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatChip({ bg, fg, value, label }: { bg: string; fg: string; value: string; label: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color: fg }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statLine}>
      <Text style={styles.statLineLabel}>{label}</Text>
      <Text style={styles.statLineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pastel.hero },

  missingWrap: { alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  notFound: { fontSize: font.body, color: pastel.mutedInk, textAlign: 'center', fontWeight: '600' },
  missingBack: {
    backgroundColor: pastel.sheet,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  missingBackText: { fontSize: font.body, fontWeight: '800', color: pastel.ink },

  hero: { width: '100%' },
  heroPhoto: { width: '100%' },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },

  sheet: {
    backgroundColor: pastel.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: spacing.xl,
    gap: spacing.lg,
  },

  name: { fontSize: font.display, fontWeight: '900', color: pastel.ink },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.sm },
  distanceText: { fontSize: font.small, color: pastel.mutedInk, fontWeight: '700' },

  statRow: { flexDirection: 'row', gap: spacing.md },
  statChip: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: font.body, fontWeight: '900' },
  statLabel: { fontSize: font.tiny, fontWeight: '700', opacity: 0.65 },

  aboutCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: pastel.dashed,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  aboutTitle: { fontSize: font.heading, fontWeight: '800', color: pastel.ink },
  aboutBody: { fontSize: font.body, color: pastel.ink, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  miniChip: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  miniChipText: { fontSize: font.tiny, fontWeight: '800' },
  intentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  intentLabel: { fontSize: font.small, fontWeight: '800', color: pastel.mutedInk, paddingTop: 4 },

  sectionHeader: { fontSize: font.heading, fontWeight: '800', color: pastel.ink },
  statsCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  scorePct: { fontSize: 40, fontWeight: '900', color: night.pink },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reasonText: { fontSize: font.small, color: pastel.ink, fontWeight: '600', flex: 1 },
  scoreNote: { fontSize: font.tiny, color: pastel.mutedInk, lineHeight: 16 },
  divider: { height: 1, backgroundColor: pastel.dashed, marginVertical: spacing.xs },

  statLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLineLabel: { fontSize: font.small, color: pastel.mutedInk, fontWeight: '700' },
  statLineValue: { fontSize: font.small, color: pastel.ink, fontWeight: '800' },
  goodWithLabel: { fontSize: font.small, color: pastel.mutedInk, fontWeight: '700', marginTop: spacing.xs },

  warnCard: {
    backgroundColor: '#FDECE5',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  warnTitle: { fontSize: font.small, fontWeight: '800', color: '#B6432F' },
  warnText: { fontSize: font.body, color: '#B6432F', fontWeight: '600', lineHeight: 21 },

  ownerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    padding: spacing.md,
  },
  ownerAvatar: { width: 44, height: 44, borderRadius: radius.pill },
  ownerText: { flex: 1, fontSize: font.body, fontWeight: '800', color: pastel.ink },

  floatRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatRight: { flexDirection: 'row', gap: spacing.sm },
  floatBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  floatBtnPressed: { opacity: 0.85, transform: [{ scale: 0.94 }] },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: pastel.sheet,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
  },
  roundBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: pastel.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPill: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: pastel.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontSize: font.body, fontWeight: '900', color: '#fff' },
});
