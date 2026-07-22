import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeBack } from '@/lib/nav';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OwnerAvatar } from '@/components/Avatar';
import { PhotoView } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { VerifiedBadge } from '@/components/ui';
import { computeCompatibility } from '@/lib/compatibility';
import { dogById, isSeedDog } from '@/lib/dogs';
import { useI18n } from '@/lib/i18n';
import { detectRealMatch } from '@/lib/matching';
import { blockUser, reportContent, sendWalkRequest } from '@/lib/remote';
import { recordSwipeRemote } from '@/lib/sync';
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
  const { height: windowHeight, width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, tx, tv } = useI18n();
  const [photoIdx, setPhotoIdx] = useState(0);

  // "Ask to join a walk" composer state.
  const [walkOpen, setWalkOpen] = useState(false);
  const [walkMsg, setWalkMsg] = useState('');
  const [walkSending, setWalkSending] = useState(false);
  const [walkResult, setWalkResult] = useState<'sent' | 'duplicate' | 'demo' | 'error' | null>(null);

  // Report / block safety sheet state.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);

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
    swipe(dog.id, 'like');
    recordSwipeRemote(dog.id, 'like');
    goBack();
    // Real dog: the DB trigger decides the match — check just after, same as
    // the discovery deck, so liking from a profile can also celebrate a match.
    if (!isSeedDog(dog.id)) {
      setTimeout(() => {
        void detectRealMatch(dog.ownerId).then((matchedDogId) => {
          if (matchedDogId) router.push({ pathname: '/match', params: { dogId: matchedDogId } });
        });
      }, 900);
    }
  };

  const submitWalkRequest = async () => {
    const msg = walkMsg.trim();
    // Demo/seed dogs have no real owner to receive the request.
    if (isSeedDog(dog.id)) {
      setWalkResult('demo');
      return;
    }
    setWalkSending(true);
    const res = await sendWalkRequest(dog.ownerId, dog.id, msg);
    setWalkSending(false);
    setWalkResult(res.ok ? 'sent' : res.reason === 'duplicate' ? 'duplicate' : 'error');
  };

  const closeWalk = () => {
    setWalkOpen(false);
    setWalkResult(null);
    setWalkMsg('');
  };

  // Block + report both persist server-side (blocked_users / reports tables).
  // Blocking a demo/seed owner is a no-op server-side but still removes them
  // from the deck locally so the control always does something visible.
  // A custom in-app sheet is used (never a browser confirm) so the app's own
  // domain is never shown to the user.
  const openReport = () => {
    setReportDone(false);
    setReportOpen(true);
  };
  const closeReport = () => {
    setReportOpen(false);
    setReportDone(false);
  };

  const doBlock = async () => {
    setReportOpen(false);
    await Promise.all([
      blockUser(dog.ownerId),
      reportContent(dog.ownerId, dog.id, 'Blocked from profile'),
    ]);
    if (inDeck) swipe(dog.id, 'pass');
    goBack();
  };

  const doReport = async () => {
    await reportContent(dog.ownerId, dog.id, 'Reported from profile');
    setReportDone(true);
  };

  // All meaningful photos (uploaded + bundled), for a swipeable gallery.
  const allPhotos = displayPhotos(dog, 1);
  const gallery = allPhotos.filter((p) => p.uri || p.module);
  const photos = gallery.length ? gallery : allPhotos.slice(0, 1);
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
        {/* ------------------------------------------------- Hero gallery */}
        <View style={[styles.hero, { height: heroHeight }]}>
          {photos.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / screenWidth))
              }
            >
              {photos.map((p) => (
                <PhotoView
                  key={p.key}
                  photo={p}
                  seed={dog.id}
                  name={dog.name}
                  style={{ width: screenWidth, height: heroHeight }}
                  emojiSize={110}
                />
              ))}
            </ScrollView>
          ) : (
            <PhotoView
              photo={photos[0]}
              seed={dog.id}
              name={dog.name}
              style={[styles.heroPhoto, { height: heroHeight }]}
              emojiSize={110}
            />
          )}
          {photos.length > 1 && (
            <View style={styles.dots} pointerEvents="none">
              {photos.map((p, i) => (
                <View key={p.key} style={[styles.dot, i === photoIdx && styles.dotOn]} />
              ))}
            </View>
          )}
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

          {/* breed · sex · age as a clean text line under the distance */}
          <Text style={styles.breedLine}>
            {tx(
              `${dog.breed}・${tv(JP_SEX, dog.sex)}・${dog.ageYears}歳`,
              `${dog.breed} · ${tv(JP_SEX, dog.sex)} · ${dog.ageYears} yrs`,
            )}
          </Text>

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

          {/* Owner card — the human behind the dog. Tap to open their profile. */}
          <Text style={styles.sectionHeader}>{tx('飼い主', 'Owner')}</Text>
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
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName} numberOfLines={1}>
                {tx(`${dog.ownerName}さん`, dog.ownerName)}
              </Text>
              <Text style={styles.ownerText} numberOfLines={1}>
                {tx(`飼い主・${dog.ownerArea}`, `Owner · ${dog.ownerArea}`)}
              </Text>
            </View>
            {dog.ownerVerified && <VerifiedBadge />}
            <Icon name="chevronRight" color={pastel.mutedInk} size={18} />
          </Pressable>
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
              onPress={openReport}
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
            <Icon name="bookmark" color={isSaved ? night.coral : pastel.ink} size={20} />
          </Pressable>
        </View>
      </View>

      {/* -------------------------------------------------- Bottom action bar */}
      {!isMine && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {isMatched && (
            <>
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
          {!isMatched && (
            <Pressable
              onPress={() => {
                setWalkResult(null);
                setWalkOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={tx('散歩に誘う', 'Ask to join a walk')}
              style={({ pressed }) => [styles.roundBtn, pressed && styles.floatBtnPressed]}
            >
              <Icon name="pin" color="#fff" size={20} />
            </Pressable>
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

      {/* -------------------------------------------- Ask-to-join-a-walk modal */}
      <Modal visible={walkOpen} transparent animationType="fade" onRequestClose={closeWalk}>
        <Pressable style={styles.walkBackdrop} onPress={closeWalk}>
          <Pressable style={styles.walkSheet} onPress={(e) => e.stopPropagation()}>
            {walkResult === null ? (
              <>
                <Text style={styles.walkTitle}>
                  {tx(`${dog.name}の散歩に誘う`, `Ask to join ${dog.name}’s walk`)}
                </Text>
                <Text style={styles.walkSub}>
                  {tx(
                    'かんたんな挨拶を送りましょう。相手が承認するとマッチしてチャットが始まります。',
                    'Send a short hello. If they accept, you’ll match and a chat opens.',
                  )}
                </Text>
                <TextInput
                  value={walkMsg}
                  onChangeText={(t) => setWalkMsg(t.slice(0, 240))}
                  placeholder={tx(
                    '例：うちの子と一緒に朝さんぽしませんか？',
                    'e.g. Would our dogs enjoy a morning walk together?',
                  )}
                  placeholderTextColor={pastel.mutedInk}
                  style={styles.walkInput}
                  multiline
                  maxLength={240}
                  accessibilityLabel={tx('あいさつメッセージ', 'Intro message')}
                />
                <Pressable
                  onPress={submitWalkRequest}
                  disabled={walkSending}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.walkSend,
                    walkSending && styles.ctaDisabled,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={styles.walkSendText}>
                    {walkSending ? tx('送信中…', 'Sending…') : tx('リクエストを送る', 'Send request')}
                  </Text>
                </Pressable>
                <Pressable onPress={closeWalk} accessibilityRole="button" style={styles.walkCancel}>
                  <Text style={styles.walkCancelText}>{tx('キャンセル', 'Cancel')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.walkEmoji}>
                  {walkResult === 'error' ? '⚠️' : walkResult === 'duplicate' ? '📨' : '🐾'}
                </Text>
                <Text style={styles.walkTitle}>
                  {walkResult === 'sent'
                    ? tx('リクエストを送りました！', 'Request sent!')
                    : walkResult === 'duplicate'
                      ? tx('すでにリクエスト済みです', 'Already requested')
                      : walkResult === 'demo'
                        ? tx('これはデモのプロフィールです', 'This is a demo profile')
                        : tx('送信できませんでした', 'Couldn’t send')}
                </Text>
                <Text style={styles.walkSub}>
                  {walkResult === 'sent'
                    ? tx(
                        `${dog.name}の飼い主さんに届きました。承認されるとマッチします。`,
                        `${dog.name}’s owner will see it. You’ll match if they accept.`,
                      )
                    : walkResult === 'duplicate'
                      ? tx('この子にはすでに散歩リクエストを送っています。', 'You’ve already sent this dog a walk request.')
                      : walkResult === 'demo'
                        ? tx(
                            'デモのわんちゃんには送れません。実際のユーザーが登録すると散歩に誘えます。',
                            'You can’t message demo dogs. Ask real users once they join.',
                          )
                        : tx('通信環境を確認して、もう一度お試しください。', 'Check your connection and try again.')}
                </Text>
                <Pressable onPress={closeWalk} accessibilityRole="button" style={styles.walkSend}>
                  <Text style={styles.walkSendText}>{tx('閉じる', 'Done')}</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* --------------------------------------------------- Report / block sheet */}
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={closeReport}>
        <Pressable style={styles.walkBackdrop} onPress={closeReport}>
          <Pressable style={styles.walkSheet} onPress={(e) => e.stopPropagation()}>
            {!reportDone ? (
              <>
                <Text style={styles.walkTitle}>{tx('安全のために', 'Keep yourself safe')}</Text>
                <Text style={styles.walkSub}>
                  {tx(
                    `${dog.name}のプロフィールについて、どうしますか？`,
                    `What would you like to do about ${dog.name}’s profile?`,
                  )}
                </Text>

                <Pressable
                  onPress={() => void doReport()}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.reportOption, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.reportEmoji}>🚩</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportOptTitle}>{tx('このプロフィールを通報', 'Report this profile')}</Text>
                    <Text style={styles.reportOptSub}>
                      {tx('不適切な内容を運営に報告します', 'Flag inappropriate content to our team')}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => void doBlock()}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.reportOption, styles.reportBlock, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.reportEmoji}>🚫</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reportOptTitle, { color: night.danger }]}>
                      {tx('この飼い主をブロック', 'Block this owner')}
                    </Text>
                    <Text style={styles.reportOptSub}>
                      {tx('今後表示されず、連絡もできません', 'They won’t appear again or be able to contact you')}
                    </Text>
                  </View>
                </Pressable>

                <Pressable onPress={closeReport} accessibilityRole="button" style={styles.walkCancel}>
                  <Text style={styles.walkCancelText}>{tx('キャンセル', 'Cancel')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.walkEmoji}>🚩</Text>
                <Text style={styles.walkTitle}>{tx('ありがとうございます', 'Thanks for the report')}</Text>
                <Text style={styles.walkSub}>
                  {tx(
                    'モデレーションチームが確認します。安心してご利用ください。',
                    'Our moderation team will review it. Thanks for keeping the community safe.',
                  )}
                </Text>
                <Pressable onPress={closeReport} accessibilityRole="button" style={styles.walkSend}>
                  <Text style={styles.walkSendText}>{tx('閉じる', 'Done')}</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  dots: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotOn: { backgroundColor: '#fff', width: 20 },

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
  breedLine: { fontSize: font.body, color: pastel.ink, fontWeight: '700', marginTop: 2 },

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
  ownerName: { fontSize: font.body, fontWeight: '800', color: pastel.ink },
  ownerText: { fontSize: font.small, fontWeight: '600', color: pastel.mutedInk, marginTop: 1 },

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

  // Ask-to-join-a-walk modal (matches this screen's pastel sheet).
  walkBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,21,19,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  walkSheet: {
    backgroundColor: pastel.sheet,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadow.card,
  },
  walkEmoji: { fontSize: 40, textAlign: 'center' },
  walkTitle: { fontSize: font.title, fontWeight: '900', color: pastel.ink, textAlign: 'center' },
  walkSub: {
    fontSize: font.small,
    color: pastel.mutedInk,
    lineHeight: 20,
    textAlign: 'center',
  },
  walkInput: {
    minHeight: 88,
    backgroundColor: '#F6F3EE',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#E7E1D7',
    padding: spacing.md,
    fontSize: font.body,
    color: pastel.ink,
    textAlignVertical: 'top',
    marginTop: spacing.xs,
  },
  walkSend: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: pastel.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadow.card,
  },
  walkSendText: { fontSize: font.body, fontWeight: '900', color: '#fff' },
  walkCancel: { alignItems: 'center', paddingVertical: spacing.sm },
  walkCancelText: { fontSize: font.small, fontWeight: '700', color: pastel.mutedInk },

  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F6F3EE',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#EAE4D8',
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  reportBlock: { backgroundColor: '#FCEDEA', borderColor: '#F6D6CF' },
  reportEmoji: { fontSize: 22 },
  reportOptTitle: { fontSize: font.body, fontWeight: '800', color: pastel.ink },
  reportOptSub: { fontSize: font.tiny, fontWeight: '600', color: pastel.mutedInk, marginTop: 1 },
});
