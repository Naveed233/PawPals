import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { ToggleRow } from '@/components/form';
import { Icon } from '@/components/icons';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle, Tag, VerifiedBadge } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { EN_PET_STATUS, JP_LANGUAGE, JP_PERSONALITY, JP_PET_STATUS, JP_SIZE } from '@/lib/jp';
import { pickAndUploadPhoto } from '@/lib/media';
import { PremiumBadge } from '@/components/PremiumBadge';
import { activateBoost, deleteOwnAccount } from '@/lib/remote';
import { supabase } from '@/lib/supabase';
import { saveDogRemote, saveProfileRemote } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const { tx, tv } = useI18n();
  const owner = useStore((s) => s.owner);
  const dogs = useStore((s) => s.dogs);
  const matches = useStore((s) => s.matches);
  const swipes = useStore((s) => s.swipes);
  const rsvps = useStore((s) => s.rsvps);
  const resetDemo = useStore((s) => s.resetDemo);
  const signOut = useStore((s) => s.signOut);
  const addDogPhoto = useStore((s) => s.addDogPhoto);
  const updateOwner = useStore((s) => s.updateOwner);

  const likeCount = swipes.filter((s) => s.direction === 'like').length;
  const rsvpCount = Object.values(rsvps).filter(Boolean).length;

  const addPhotoTo = async (dogId: string) => {
    const uri = await pickAndUploadPhoto();
    if (!uri) return;
    addDogPhoto(dogId, uri);
    const updated = useStore.getState().dogs.find((d) => d.id === dogId);
    if (updated) void saveDogRemote(updated);
  };

  const boostedUntil = owner?.boostedUntil ?? 0;
  const boostActive = boostedUntil > Date.now();
  const boostMinsLeft = Math.max(1, Math.round((boostedUntil - Date.now()) / 60000));
  const boost = async () => {
    if (boostActive) return;
    const until = await activateBoost(30);
    // Optimistic locally even if the server call is a no-op (SQL not yet run).
    updateOwner({ boostedUntil: until ?? Date.now() + 30 * 60000 });
  };

  const confirmDelete = () => {
    const title = tx('アカウントを削除しますか？', 'Delete account?');
    const message = tx(
      'アカウントとすべてのデータが完全に削除されます。この操作は取り消せません。',
      'Your account and all data will be permanently deleted. This cannot be undone.',
    );
    const proceed = async () => {
      const ok = await deleteOwnAccount();
      if (ok) {
        signOut();
        router.replace('/');
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(
          tx('削除に失敗しました。もう一度お試しください。', 'Deletion failed. Please try again.'),
        );
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) void proceed();
    } else {
      Alert.alert(title, message, [
        { text: tx('キャンセル', 'Cancel'), style: 'cancel' },
        { text: tx('削除する', 'Delete'), style: 'destructive', onPress: () => void proceed() },
      ]);
    }
  };

  const confirmSignOut = () => {
    const title = tx('サインアウトしますか？', 'Sign out?');
    const message = tx(
      'この端末のローカルデモアカウントを消去します。',
      'This clears the local demo account on this device.',
    );
    const proceed = () => {
      void supabase.auth.signOut();
      signOut();
      router.replace('/');
    };
    // RN Alert is a no-op on web — fall back to window.confirm there.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) proceed();
    } else {
      Alert.alert(title, message, [
        { text: tx('キャンセル', 'Cancel'), style: 'cancel' },
        { text: tx('サインアウト', 'Sign out'), style: 'destructive', onPress: proceed },
      ]);
    }
  };

  if (!owner) return null;

  const petStatus = owner.petStatus ?? 'has-dog';

  return (
    <Screen title={tx('プロフィール', 'Profile')}>
      {/* ------------------------------------------------ Owner hero */}
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <OwnerAvatar
            ownerId={owner.id}
            name={owner.firstName}
            uri={owner.photo}
            style={styles.avatar}
            rounded={radius.pill}
            size={112}
          />
        </View>
        <View style={styles.ownerNameRow}>
          <Text style={styles.ownerName}>{owner.firstName}</Text>
          {owner.verified && <VerifiedBadge />}
        </View>
        <View style={styles.areaRow}>
          <Icon name="pin" color={night.muted} size={14} />
          <Text style={styles.area}>{owner.area}</Text>
        </View>
        {!!owner.bio && <Text style={styles.bio}>{owner.bio}</Text>}
        {owner.languages.length > 0 && (
          <View style={styles.tagRow}>
            {owner.languages.map((l) => (
              <Tag key={l} label={tv(JP_LANGUAGE, l)} tone="blue" />
            ))}
          </View>
        )}
        <Button
          label={tx('プロフィールを編集', 'Edit profile')}
          variant="outline"
          icon={<Icon name="edit" color="#fff" size={16} />}
          onPress={() => router.push('/edit-owner')}
          style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
        />
      </View>

      {/* --------------------------------------------- Boost (Premium) */}
      <Pressable
        onPress={boost}
        accessibilityRole="button"
        accessibilityLabel={tx('プロフィールをブースト', 'Boost your profile')}
        style={({ pressed }) => [styles.boostCard, boostActive && styles.boostCardOn, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.boostIcon}>
          <Icon name="bolt" color="#fff" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.boostTitleRow}>
            <Text style={styles.boostTitle}>
              {boostActive ? tx('ブースト中！', 'Boost active!') : tx('プロフィールをブースト', 'Boost your profile')}
            </Text>
            <PremiumBadge />
          </View>
          <Text style={styles.boostSub}>
            {boostActive
              ? tx(`あと約${boostMinsLeft}分、一番上に表示中`, `Top of the deck for ~${boostMinsLeft} more min`)
              : tx('30分間、近くのみんなの一番上に表示されます', 'Be first in the deck near you for 30 minutes')}
          </Text>
        </View>
        {!boostActive && <Icon name="chevronRight" color={night.muted} size={20} />}
      </Pressable>

      {/* --------------------------------------------- Privacy */}
      <SectionTitle>{tx('プライバシー', 'Privacy')}</SectionTitle>
      <Card>
        <ToggleRow
          label={tx('マッチした相手にプロフィールを公開', 'Show my profile to matches')}
          value={owner.showProfileToMatches ?? true}
          onValueChange={(v) => {
            updateOwner({ showProfileToMatches: v });
            const next = useStore.getState().owner;
            if (next) void saveProfileRemote(next);
          }}
        />
        <Text style={styles.privacyNote}>
          {tx(
            'オンにすると、マッチした相手にだけあなたのプロフィール（名前・エリア・自己紹介）が表示されます。マッチする前は誰にも表示されません。',
            'When this is on, only people you have matched with can see your profile (name, area, and bio). No one can see it before you match.',
          )}
        </Text>
      </Card>

      {/* --------------------------------------------- Language */}
      <SectionTitle>{tx('言語', 'Language')}</SectionTitle>
      <Card>
        <LanguageToggle style={{ alignSelf: 'flex-start' }} />
      </Card>

      {/* ------------------------------------------------ Stats */}
      <SectionTitle>{tx('プロフィール統計', 'Profile stats')}</SectionTitle>
      <View style={styles.statsGrid}>
        <Stat value={swipes.length} label={tx('スワイプ', 'Swipes')} />
        <Stat value={likeCount} label={tx('いいね送信', 'Likes sent')} />
        <Stat value={matches.length} label={tx('マッチ', 'Matches')} />
        <Stat value={rsvpCount} label={tx('イベント参加', 'Events joined')} />
      </View>

      {/* ------------------------------------------------ Pets */}
      <SectionTitle>{tx('ペット', 'Pets')}</SectionTitle>
      {dogs.length > 0 ? (
        dogs.map((dog) => (
          <Card key={dog.id} style={styles.dogCard}>
            <DogPhoto dog={dog} style={styles.dogThumb} rounded={radius.md} emojiSize={34} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.dogName}>{dog.name}</Text>
              <Text style={styles.dogMeta}>
                {tx(
                  `${dog.breed}・${dog.ageYears}歳・${tv(JP_SIZE, dog.size)}`,
                  `${dog.breed} · ${dog.ageYears} yrs · ${tv(JP_SIZE, dog.size)}`,
                )}
              </Text>
              <View style={styles.tagRowLeft}>
                {dog.personality.slice(0, 3).map((t) => (
                  <Tag key={t} label={tv(JP_PERSONALITY, t)} />
                ))}
              </View>
            </View>
            <View style={styles.dogActions}>
              <Pressable
                onPress={() => router.push(`/edit-dog/${dog.id}`)}
                style={styles.smallBtn}
                accessibilityRole="button"
                accessibilityLabel={tx(`${dog.name}を編集`, `Edit ${dog.name}`)}
              >
                <Icon name="edit" color="#fff" size={12} />
                <Text style={styles.smallBtnText}>{tx('編集', 'Edit')}</Text>
              </Pressable>
              <Pressable
                onPress={() => addPhotoTo(dog.id)}
                style={styles.smallBtn}
                accessibilityRole="button"
                accessibilityLabel={tx(`${dog.name}の写真を追加`, `Add a photo of ${dog.name}`)}
              >
                <Icon name="camera" color="#fff" size={12} />
                <Text style={styles.smallBtnText}>{tx('写真', 'Photo')}</Text>
              </Pressable>
            </View>
          </Card>
        ))
      ) : petStatus === 'has-other-pet' ? (
        <Card style={styles.petStatusCard}>
          <View style={styles.pawBadge}>
            <Icon name="pawFill" color={night.pink} size={24} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.petStatusTitle}>
              {tx(
                (owner.otherPetType?.trim() || 'ほかのペット') + 'を飼っています',
                owner.otherPetType?.trim()
                  ? `I have a ${owner.otherPetType.trim()}`
                  : 'I have another pet',
              )}
            </Text>
            <Text style={styles.petStatusHint}>
              {tx(
                '犬がいなくても、ワンちゃんや飼い主さんを探してマッチできます。',
                'No dog needed — you can still browse dogs and their owners and match.',
              )}
            </Text>
          </View>
        </Card>
      ) : petStatus === 'no-pet-meet' || petStatus === 'no-pet-future' ? (
        <Card style={styles.petStatusCard}>
          <View style={styles.pawBadge}>
            <Icon name="pawFill" color={night.pink} size={24} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.petStatusTitle}>{tx(JP_PET_STATUS[petStatus] ?? petStatus, EN_PET_STATUS[petStatus] ?? petStatus)}</Text>
            <Text style={styles.petStatusHint}>
              {tx(
                'ペットがいなくても、ワンちゃんを見つけていいねやマッチができます。',
                'No pet needed — you can still discover dogs, send likes, and match.',
              )}
            </Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.petStatusCard}>
          <View style={styles.pawBadge}>
            <Icon name="pawFill" color={night.pink} size={24} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.petStatusTitle}>
              {tx('ペットプロフィールがまだありません', 'No pet profiles yet')}
            </Text>
            <Text style={styles.petStatusHint}>
              {tx(
                '下の「犬を追加」からワンちゃんのプロフィールを作成できます。',
                'Tap "Add a dog" below to create a profile for your pup.',
              )}
            </Text>
          </View>
        </Card>
      )}

      {/* ------------------------------------------------ Actions */}
      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button
          label={tx('犬を追加', 'Add a dog')}
          variant="outline"
          icon={<Icon name="plus" color="#fff" size={16} />}
          onPress={() => router.push('/onboarding/dog')}
        />
        <Button
          label={tx('プライバシーポリシー', 'Privacy Policy')}
          variant="ghost"
          onPress={() => router.push('/privacy')}
        />
        <Button label={tx('デモをリセット', 'Reset demo')} variant="ghost" onPress={resetDemo} />
        <Button label={tx('サインアウト', 'Sign out')} variant="ghost" onPress={confirmSignOut} />
        <Button
          label={tx('アカウントを削除', 'Delete account')}
          variant="ghost"
          onPress={confirmDelete}
          style={{ borderWidth: 0 }}
        />
        <Text style={styles.deleteHint}>
          {tx(
            'アカウントとすべてのデータ（プロフィール・ペット・メッセージ）が完全に削除されます。取り消せません。',
            'Permanently deletes your account and all data (profile, pets, messages). This cannot be undone.',
          )}
        </Text>
      </View>

      <Text style={styles.disclaimer}>
        {tx(
          'PawPairは犬の友だち作りとミートアップのためのプラットフォームであり、人間向けの恋愛マッチングアプリではありません。ミートアップ時の犬の見守りと安全確認は各飼い主の責任です。',
          'PawPair is a platform for dog friendships and meetups, not a dating app for humans. Owners are responsible for supervising their dogs and keeping meetups safe.',
        )}
      </Text>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${label} ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  privacyNote: {
    fontSize: font.tiny,
    color: night.faint,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  avatarRing: {
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: night.pink,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerName: { fontSize: 26, fontWeight: '900', color: night.text },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  area: { fontSize: font.small, color: night.muted, fontWeight: '600' },
  bio: { fontSize: font.body, color: night.muted, textAlign: 'center', lineHeight: 21 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tagRowLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: {
    flexBasis: '45%',
    flexGrow: 1,
    backgroundColor: night.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: night.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: night.pink },
  statLabel: { fontSize: font.tiny, color: night.muted, fontWeight: '700' },

  dogCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl },
  dogThumb: { width: 64, height: 64 },
  dogActions: { gap: spacing.sm, alignItems: 'stretch' },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: night.border,
    backgroundColor: night.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtnText: { color: night.text, fontWeight: '700', fontSize: font.tiny },
  dogName: { fontSize: font.heading, fontWeight: '800', color: night.text },
  dogMeta: { fontSize: font.small, color: night.muted, fontWeight: '600' },

  petStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
  },
  pawBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: night.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petStatusTitle: { fontSize: font.body, fontWeight: '800', color: night.text },
  petStatusHint: { fontSize: font.small, color: night.muted, lineHeight: 19 },

  disclaimer: {
    fontSize: font.tiny,
    color: night.faint,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  deleteHint: {
    fontSize: font.tiny,
    color: night.faint,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: night.card,
    borderWidth: 1,
    borderColor: 'rgba(240,196,74,0.35)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  boostCardOn: { borderColor: night.pink, backgroundColor: night.pinkSoft },
  boostIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0C44A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  boostTitle: { color: night.text, fontSize: font.body, fontWeight: '800' },
  boostSub: { color: night.muted, fontSize: font.tiny, marginTop: 2 },
});
