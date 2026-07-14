import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
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
import { SEED_DOGS } from '@/data/seed';
import { computeCompatibility } from '@/lib/compatibility';
import {
  JP_ENERGY,
  JP_GOOD_WITH,
  JP_INTENT,
  JP_MEETUP,
  JP_PERSONALITY,
  JP_PLAY_STYLE,
  JP_RECALL,
  JP_SEX,
  JP_SOCIAL,
  jp,
} from '@/lib/jp';
import { displayPhotos } from '@/lib/photos';
import { useStore } from '@/store';
import { font, night, pastel, radius, shadow, spacing } from '@/theme';
import type { GoodWith } from '@/types';

/** Light pastel pet-profile page — the one intentionally NOT dark screen. */
export default function DogDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const myDog = useStore((s) => s.dogs[0]);
  const myDogs = useStore((s) => s.dogs);
  const saved = useStore((s) => s.saved);
  const deck = useStore((s) => s.deck);
  const toggleSave = useStore((s) => s.toggleSave);
  const swipe = useStore((s) => s.swipe);
  const matches = useStore((s) => s.matches);

  const dog = SEED_DOGS.find((d) => d.id === id) ?? myDogs.find((d) => d.id === id);

  if (!dog) {
    return (
      <View style={[styles.page, styles.missingWrap, { paddingTop: insets.top + spacing.xl }]}>
        <StatusBar style="dark" />
        <Text style={styles.notFound}>このプロフィールは表示できません。</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="戻る"
          style={styles.missingBack}
        >
          <Text style={styles.missingBackText}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  const isMine = myDogs.some((d) => d.id === dog.id);
  const compat = myDog && !isMine ? computeCompatibility(myDog, dog) : null;
  const inDeck = (deck ?? []).includes(dog.id);
  const isSaved = saved.includes(dog.id);
  const isMatched = matches.some((m) => m.dogId === dog.id);

  const like = () => {
    const match = swipe(dog.id, 'like');
    router.back();
    if (match) router.push({ pathname: '/match', params: { dogId: dog.id } });
  };

  const report = () =>
    Alert.alert('通報・ブロック', `${dog.name}のプロフィールについて、どうしますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'プロフィールを通報',
        onPress: () => Alert.alert('ありがとうございます', 'モデレーションチームが確認します。'),
      },
      {
        text: 'ブロック',
        style: 'destructive',
        onPress: () => {
          if (inDeck) swipe(dog.id, 'pass');
          router.back();
        },
      },
    ]);

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
            <Text style={styles.distanceText}>{dog.distanceKm} km 先</Text>
          </View>

          {/* stat chips */}
          <View style={styles.statRow}>
            <StatChip bg={pastel.lavender} fg={pastel.lavenderText} value={jp(JP_SEX, dog.sex)} label="性別" />
            <StatChip bg={pastel.butter} fg={pastel.butterText} value={`${dog.ageYears}歳`} label="年齢" />
            <StatChip bg={pastel.mint} fg={pastel.mintText} value={dog.breed} label="犬種" />
          </View>

          {/* about card */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>{dog.name}について</Text>
            {!!dog.notes && <Text style={styles.aboutBody}>{dog.notes}</Text>}
            <View style={styles.tagRow}>
              {[...dog.personality.map((t) => jp(JP_PERSONALITY, t)), ...dog.playStyle.map((t) => jp(JP_PLAY_STYLE, t))].map(
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
                <Text style={styles.intentLabel}>目的：</Text>
                <View style={[styles.tagRow, { flex: 1 }]}>
                  {dog.intents.map((it) => (
                    <View key={it} style={[styles.miniChip, { backgroundColor: pastel.lavender }]}>
                      <Text style={[styles.miniChipText, { color: pastel.lavenderText }]}>{jp(JP_INTENT, it)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* compatibility / stats */}
          <Text style={styles.sectionHeader}>相性スコア</Text>
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
                      <Text style={styles.reasonText}>共通点は少なめですが、会ってみる価値はあるかも。</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.scoreNote}>
                  スコアは好みの一致度を示すものです。安全性やフレンドリーさを保証するものではありません。
                </Text>
                <View style={styles.divider} />
              </>
            ) : null}

            <StatLine label="エネルギー" value={jp(JP_ENERGY, dog.energy)} />
            <StatLine label="社交性" value={jp(JP_SOCIAL, dog.social)} />
            <StatLine label="呼び戻し" value={jp(JP_RECALL, dog.recall)} />
            <StatLine label="体重" value={dog.weightKg ? `${dog.weightKg} kg` : '—'} />
            <StatLine label="ワクチン接種" value={dog.vaccinated ? '済み' : '未'} />
            <StatLine label="去勢・避妊" value={dog.neutered ? '済み' : '未'} />
            <StatLine label="希望の会い方" value={jp(JP_MEETUP, dog.meetupPref)} />

            <Text style={styles.goodWithLabel}>一緒に遊べる相手</Text>
            <View style={styles.tagRow}>
              {goodWithEntries.map((key) => {
                const ok = dog.goodWith[key];
                return (
                  <View
                    key={key}
                    style={[styles.miniChip, { backgroundColor: ok ? pastel.mint : '#F1EEE9' }]}
                  >
                    <Text style={[styles.miniChipText, { color: ok ? pastel.mintText : pastel.mutedInk }]}>
                      {ok ? '✓' : '✕'} {JP_GOOD_WITH[key]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {!!dog.avoid && (
            <View style={styles.warnCard}>
              <Text style={styles.warnTitle}>ご注意</Text>
              <Text style={styles.warnText}>⚠️ {dog.avoid}</Text>
            </View>
          )}

          {/* owner strip — the owner's profile stays private until a match */}
          {isMatched && (
            <View style={styles.ownerStrip}>
              <OwnerAvatar
                ownerId={dog.ownerId}
                name={dog.ownerName}
                style={styles.ownerAvatar}
                rounded={radius.pill}
                size={22}
              />
              <Text style={styles.ownerText} numberOfLines={1}>
                飼い主：{dog.ownerName}・{dog.ownerArea}
              </Text>
              {dog.ownerVerified && <VerifiedBadge />}
            </View>
          )}
        </View>
      </ScrollView>

      {/* -------------------------------------------- Floating header buttons */}
      <View style={[styles.floatRow, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="戻る"
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
              accessibilityLabel="通報・ブロック"
              hitSlop={8}
              style={({ pressed }) => [styles.floatBtn, pressed && styles.floatBtnPressed]}
            >
              <Icon name="dots" color={pastel.ink} size={20} />
            </Pressable>
          )}
          <Pressable
            onPress={() => toggleSave(dog.id)}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? '保存を取り消す' : 'プロフィールを保存'}
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
                accessibilityLabel="電話をかける"
                style={({ pressed }) => [styles.roundBtn, pressed && styles.floatBtnPressed]}
              >
                <Icon name="phone" color="#fff" size={20} />
              </Pressable>
              <Pressable
                onPress={() => router.push(`/chat/${dog.id}`)}
                accessibilityRole="button"
                accessibilityLabel="チャットを開く"
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
            accessibilityLabel={isMatched ? 'マッチ済み。チャットを開く' : '会いたい！'}
            accessibilityState={{ disabled: !isMatched && !inDeck }}
            style={({ pressed }) => [
              styles.ctaPill,
              (!isMatched && !inDeck) && styles.ctaDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Icon name="pawFill" color="#fff" size={20} />
            <Text style={styles.ctaText}>{isMatched ? 'マッチ済み ✓' : '会いたい！'}</Text>
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
