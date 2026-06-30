import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle, Tag, VerifiedBadge } from '@/components/ui';
import { pickPhoto } from '@/lib/media';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const owner = useStore((s) => s.owner);
  const dogs = useStore((s) => s.dogs);
  const matches = useStore((s) => s.matches);
  const saved = useStore((s) => s.saved);
  const swipes = useStore((s) => s.swipes);
  const resetDemo = useStore((s) => s.resetDemo);
  const signOut = useStore((s) => s.signOut);
  const addDogPhoto = useStore((s) => s.addDogPhoto);

  const likeCount = swipes.filter((s) => s.direction === 'like').length;

  const addPhotoTo = async (dogId: string) => {
    const uri = await pickPhoto();
    if (uri) addDogPhoto(dogId, uri);
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'This clears the local demo account on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/');
        },
      },
    ]);

  if (!owner) return null;

  return (
    <Screen title="Profile">
      <Card style={{ alignItems: 'center', gap: spacing.sm }}>
        <OwnerAvatar ownerId={owner.id} name={owner.firstName} uri={owner.photo} style={styles.avatar} rounded={radius.pill} size={76} />
        <View style={styles.ownerNameRow}>
          <Text style={styles.ownerName}>{owner.firstName}</Text>
          {owner.verified && <VerifiedBadge />}
        </View>
        <Text style={styles.area}>📍 {owner.area}</Text>
        {!!owner.bio && <Text style={styles.bio}>{owner.bio}</Text>}
        {owner.languages.length > 0 && (
          <View style={styles.tagRow}>
            {owner.languages.map((l) => (
              <Tag key={l} label={l} tone="blue" />
            ))}
          </View>
        )}
        <Button label="Edit your profile" variant="outline" onPress={() => router.push('/edit-owner')} style={{ alignSelf: 'stretch', marginTop: spacing.sm }} />
      </Card>

      <View style={styles.statsRow}>
        <Stat value={likeCount} label="Likes sent" />
        <Stat value={matches.length} label="Matches" />
        <Stat value={saved.length} label="Saved" />
      </View>

      <SectionTitle>Your dogs</SectionTitle>
      {dogs.map((dog) => (
        <Card key={dog.id} style={styles.dogCard}>
          <DogPhoto dog={dog} style={styles.dogThumb} rounded={radius.md} emojiSize={34} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.dogName}>{dog.name}</Text>
            <Text style={styles.dogMeta}>
              {dog.breed} · {dog.ageYears}y · {dog.size}
            </Text>
            <View style={styles.tagRowLeft}>
              {dog.personality.slice(0, 3).map((t) => (
                <Tag key={t} label={t} />
              ))}
            </View>
          </View>
          <View style={styles.dogActions}>
            <Pressable
              onPress={() => router.push(`/edit-dog/${dog.id}`)}
              style={styles.smallBtn}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${dog.name}`}
            >
              <Text style={styles.smallBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => addPhotoTo(dog.id)}
              style={styles.smallBtn}
              accessibilityRole="button"
              accessibilityLabel={`Add a photo for ${dog.name}`}
            >
              <Text style={styles.smallBtnText}>＋ Photo</Text>
            </Pressable>
          </View>
        </Card>
      ))}

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button label="Add another dog" variant="outline" onPress={() => router.push('/onboarding/dog')} />
        <Button label="Reset demo deck" variant="ghost" onPress={resetDemo} />
        <Button label="Sign out" variant="ghost" onPress={confirmSignOut} />
      </View>

      <Text style={styles.disclaimer}>
        PawPair is a dog friendship and meetup platform — not a human dating app. Owners are
        responsible for supervising their dogs and assessing each meetup.
      </Text>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerName: { fontSize: font.title, fontWeight: '900', color: colors.charcoal },
  area: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  bio: { fontSize: font.body, color: colors.charcoal, textAlign: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tagRowLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: font.title, fontWeight: '900', color: colors.forest },
  statLabel: { fontSize: font.tiny, color: colors.muted, fontWeight: '700' },

  dogCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dogThumb: { width: 64, height: 64 },
  dogActions: { gap: spacing.sm, alignItems: 'stretch' },
  smallBtn: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  smallBtnText: { color: colors.forest, fontWeight: '700', fontSize: font.tiny },
  dogName: { fontSize: font.heading, fontWeight: '800', color: colors.charcoal },
  dogMeta: { fontSize: font.small, color: colors.muted, fontWeight: '600' },

  disclaimer: { fontSize: font.tiny, color: colors.faint, lineHeight: 16, textAlign: 'center', marginTop: spacing.md },
});
