import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { ToggleRow } from '@/components/form';
import { Icon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle, Tag, VerifiedBadge } from '@/components/ui';
import { JP_LANGUAGE, JP_PERSONALITY, JP_PET_STATUS, JP_SIZE, jp } from '@/lib/jp';
import { pickPhoto } from '@/lib/media';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

export default function Profile() {
  const router = useRouter();
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
    const uri = await pickPhoto();
    if (uri) addDogPhoto(dogId, uri);
  };

  const confirmSignOut = () => {
    const title = 'サインアウトしますか？';
    const message = 'この端末のローカルデモアカウントを消去します。';
    const proceed = () => {
      signOut();
      router.replace('/');
    };
    // RN Alert is a no-op on web — fall back to window.confirm there.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) proceed();
    } else {
      Alert.alert(title, message, [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'サインアウト', style: 'destructive', onPress: proceed },
      ]);
    }
  };

  if (!owner) return null;

  const petStatus = owner.petStatus ?? 'has-dog';

  return (
    <Screen title="プロフィール">
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
              <Tag key={l} label={jp(JP_LANGUAGE, l)} tone="blue" />
            ))}
          </View>
        )}
        <Button
          label="プロフィールを編集"
          variant="outline"
          icon={<Icon name="edit" color="#fff" size={16} />}
          onPress={() => router.push('/edit-owner')}
          style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
        />
      </View>

      {/* --------------------------------------------- Privacy */}
      <SectionTitle>プライバシー</SectionTitle>
      <Card>
        <ToggleRow
          label="マッチした相手にプロフィールを公開"
          value={owner.showProfileToMatches ?? true}
          onValueChange={(v) => updateOwner({ showProfileToMatches: v })}
        />
        <Text style={styles.privacyNote}>
          オンにすると、マッチした相手にだけあなたのプロフィール（名前・エリア・自己紹介）が表示されます。マッチする前は誰にも表示されません。
        </Text>
      </Card>

      {/* ------------------------------------------------ Stats */}
      <SectionTitle>プロフィール統計</SectionTitle>
      <View style={styles.statsGrid}>
        <Stat value={swipes.length} label="スワイプ" />
        <Stat value={likeCount} label="いいね送信" />
        <Stat value={matches.length} label="マッチ" />
        <Stat value={rsvpCount} label="イベント参加" />
      </View>

      {/* ------------------------------------------------ Pets */}
      <SectionTitle>ペット</SectionTitle>
      {dogs.length > 0 ? (
        dogs.map((dog) => (
          <Card key={dog.id} style={styles.dogCard}>
            <DogPhoto dog={dog} style={styles.dogThumb} rounded={radius.md} emojiSize={34} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.dogName}>{dog.name}</Text>
              <Text style={styles.dogMeta}>
                {dog.breed}・{dog.ageYears}歳・{jp(JP_SIZE, dog.size)}
              </Text>
              <View style={styles.tagRowLeft}>
                {dog.personality.slice(0, 3).map((t) => (
                  <Tag key={t} label={jp(JP_PERSONALITY, t)} />
                ))}
              </View>
            </View>
            <View style={styles.dogActions}>
              <Pressable
                onPress={() => router.push(`/edit-dog/${dog.id}`)}
                style={styles.smallBtn}
                accessibilityRole="button"
                accessibilityLabel={`${dog.name}を編集`}
              >
                <Icon name="edit" color="#fff" size={12} />
                <Text style={styles.smallBtnText}>編集</Text>
              </Pressable>
              <Pressable
                onPress={() => addPhotoTo(dog.id)}
                style={styles.smallBtn}
                accessibilityRole="button"
                accessibilityLabel={`${dog.name}の写真を追加`}
              >
                <Icon name="camera" color="#fff" size={12} />
                <Text style={styles.smallBtnText}>写真</Text>
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
              {(owner.otherPetType?.trim() || 'ほかのペット') + 'を飼っています'}
            </Text>
            <Text style={styles.petStatusHint}>
              犬がいなくても、ワンちゃんや飼い主さんを探してマッチできます。
            </Text>
          </View>
        </Card>
      ) : petStatus === 'no-pet-meet' || petStatus === 'no-pet-future' ? (
        <Card style={styles.petStatusCard}>
          <View style={styles.pawBadge}>
            <Icon name="pawFill" color={night.pink} size={24} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.petStatusTitle}>{jp(JP_PET_STATUS, petStatus)}</Text>
            <Text style={styles.petStatusHint}>
              ペットがいなくても、ワンちゃんを見つけていいねやマッチができます。
            </Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.petStatusCard}>
          <View style={styles.pawBadge}>
            <Icon name="pawFill" color={night.pink} size={24} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.petStatusTitle}>ペットプロフィールがまだありません</Text>
            <Text style={styles.petStatusHint}>
              下の「犬を追加」からワンちゃんのプロフィールを作成できます。
            </Text>
          </View>
        </Card>
      )}

      {/* ------------------------------------------------ Actions */}
      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button
          label="犬を追加"
          variant="outline"
          icon={<Icon name="plus" color="#fff" size={16} />}
          onPress={() => router.push('/onboarding/dog')}
        />
        <Button label="デモをリセット" variant="ghost" onPress={resetDemo} />
        <Button label="サインアウト" variant="ghost" onPress={confirmSignOut} />
      </View>

      <Text style={styles.disclaimer}>
        PawPairは犬の友だち作りとミートアップのためのプラットフォームであり、人間向けの恋愛マッチングアプリではありません。ミートアップ時の犬の見守りと安全確認は各飼い主の責任です。
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
});
