import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/anim';
import { OwnerAvatar } from '@/components/Avatar';
import { PhotoView } from '@/components/DogPhoto';
import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle, Tag, VerifiedBadge } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { computeCompatibility } from '@/lib/compatibility';
import { displayPhotos } from '@/lib/photos';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme';

export default function DogDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const myDog = useStore((s) => s.dogs[0]);
  const myDogs = useStore((s) => s.dogs);
  const saved = useStore((s) => s.saved);
  const deck = useStore((s) => s.deck);
  const toggleSave = useStore((s) => s.toggleSave);
  const swipe = useStore((s) => s.swipe);
  const photoLikes = useStore((s) => s.photoLikes);
  const likedPhotos = useStore((s) => s.likedPhotos);
  const togglePhotoLike = useStore((s) => s.togglePhotoLike);
  const matches = useStore((s) => s.matches);

  const dog = SEED_DOGS.find((d) => d.id === id) ?? myDogs.find((d) => d.id === id);

  if (!dog) {
    return (
      <Screen title="Profile" onBack={() => router.back()}>
        <Text style={styles.notFound}>This profile is no longer available.</Text>
      </Screen>
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
    Alert.alert('Report or block', `What would you like to do about ${dog.name}'s profile?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report profile', onPress: () => Alert.alert('Thanks', 'Our moderation team will review this profile.') },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          if (inDeck) swipe(dog.id, 'pass');
          router.back();
        },
      },
    ]);

  return (
    <Screen
      title={dog.name}
      onBack={() => router.back()}
      right={
        <Text onPress={report} style={styles.report} accessibilityRole="button">
          ⚐
        </Text>
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
      >
        {displayPhotos(dog, 4).map((p) => {
          const liked = likedPhotos.includes(p.key);
          const count = photoLikes[p.key] ?? 0;
          return (
            <View key={p.key} style={styles.tile}>
              <PhotoView photo={p} seed={dog.id} name={dog.name} style={styles.tilePhoto} rounded={radius.xl} emojiSize={88} />
              <AnimatedPressable
                onPress={() => togglePhotoLike(p.key)}
                accessibilityLabel={liked ? 'Unlike photo' : 'Like photo'}
                style={styles.likeChip}
              >
                <Text style={styles.likeHeart}>{liked ? '❤️' : '🤍'}</Text>
                <Text style={styles.likeCount}>{count}</Text>
              </AnimatedPressable>
            </View>
          );
        })}
      </ScrollView>
      <Text style={styles.galleryHint}>Tap 🤍 to like a photo — likes are anonymous.</Text>

      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {dog.name} <Text style={styles.age}>{dog.ageYears}y</Text>
          </Text>
          <Text style={styles.breed}>
            {dog.breed} · {dog.sex}
          </Text>
        </View>
        {compat && (
          <View style={styles.compat}>
            <Text style={styles.compatPct}>{compat.score}%</Text>
            <Text style={styles.compatLabel}>match</Text>
          </View>
        )}
      </View>

      {dog.intents.length > 0 && (
        <>
          <SectionTitle>Looking for</SectionTitle>
          <View style={styles.tagRow}>
            {dog.intents.map((it) => (
              <Tag key={it} label={it} tone="blue" />
            ))}
          </View>
        </>
      )}

      {compat && compat.reasons.length > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle>Why you might get along</SectionTitle>
          {compat.reasons.map((r) => (
            <Text key={r} style={styles.reason}>
              ✓ {r}
            </Text>
          ))}
          <Text style={styles.compatNote}>
            A score reflects shared preferences only — it does not mean a dog is guaranteed safe or
            friendly.
          </Text>
        </Card>
      )}

      <SectionTitle>Quick facts</SectionTitle>
      <View style={styles.facts}>
        <Fact label="Size" value={dog.size} />
        <Fact label="Weight" value={dog.weightKg ? `${dog.weightKg} kg` : '—'} />
        <Fact label="Energy" value={dog.energy} />
        <Fact label="Social" value={dog.social} />
        <Fact label="Recall" value={dog.recall} />
        <Fact label="Distance" value={`${dog.distanceKm} km`} />
        <Fact label="Vaccinated" value={dog.vaccinated ? 'Yes' : 'No'} />
        <Fact label="Neutered" value={dog.neutered ? 'Yes' : 'No'} />
      </View>

      <SectionTitle>Personality</SectionTitle>
      <View style={styles.tagRow}>
        {dog.personality.map((t) => (
          <Tag key={t} label={t} />
        ))}
      </View>

      <SectionTitle>Play style</SectionTitle>
      <View style={styles.tagRow}>
        {dog.playStyle.map((t) => (
          <Tag key={t} label={t} tone="blue" />
        ))}
      </View>

      <SectionTitle>Comfortable with</SectionTitle>
      <View style={styles.tagRow}>
        <ComfortTag ok={dog.goodWith.smallDogs} label="Small dogs" />
        <ComfortTag ok={dog.goodWith.largeDogs} label="Large dogs" />
        <ComfortTag ok={dog.goodWith.puppies} label="Puppies" />
        <ComfortTag ok={dog.goodWith.seniors} label="Senior dogs" />
        <ComfortTag ok={dog.goodWith.children} label="Children" />
      </View>

      <Card style={{ gap: spacing.xs }}>
        <SectionTitle>Ideal meetup</SectionTitle>
        <Text style={styles.meetup}>🐾 {dog.meetupPref}</Text>
      </Card>

      {!!dog.notes && (
        <Card style={{ gap: spacing.xs }}>
          <SectionTitle>About {dog.name}</SectionTitle>
          <Text style={styles.body}>{dog.notes}</Text>
        </Card>
      )}

      {!!dog.avoid && (
        <Card style={[styles.warn, { gap: spacing.xs }]}>
          <SectionTitle>Please note</SectionTitle>
          <Text style={styles.warnText}>⚠️ {dog.avoid}</Text>
        </Card>
      )}

      <Card style={styles.ownerCard}>
        <OwnerAvatar ownerId={dog.ownerId} name={dog.ownerName} style={styles.ownerAvatar} rounded={radius.pill} size={22} />
        <View style={{ flex: 1 }}>
          <View style={styles.ownerNameRow}>
            <Text style={styles.ownerName}>{dog.ownerName}</Text>
            {dog.ownerVerified && <VerifiedBadge />}
          </View>
          <Text style={styles.ownerArea}>📍 {dog.ownerArea}</Text>
        </View>
      </Card>

      {!isMine && (
        <View style={{ gap: spacing.md }}>
          {isMatched && (
            <Button label={`Message ${dog.name}'s owner`} onPress={() => router.push(`/chat/${dog.id}`)} />
          )}
          {inDeck && !isMatched && <Button label="Like" onPress={like} variant="primary" />}
          <Button
            label={isSaved ? 'Saved ✓' : 'Save profile'}
            variant="outline"
            onPress={() => toggleSave(dog.id)}
          />
        </View>
      )}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function ComfortTag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[styles.comfort, { backgroundColor: ok ? colors.forestSoft : colors.surfaceAlt }]}>
      <Text style={[styles.comfortText, { color: ok ? colors.forestDark : colors.faint }]}>
        {ok ? '✓' : '✕'} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { gap: spacing.md, paddingRight: spacing.lg },
  tile: { width: 240, height: 300 },
  tilePhoto: { width: 240, height: 300, backgroundColor: colors.forestSoft },
  likeChip: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  likeHeart: { fontSize: 16 },
  likeCount: { fontSize: font.small, fontWeight: '800', color: colors.charcoal },
  galleryHint: { fontSize: font.tiny, color: colors.faint, fontWeight: '600' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: font.display, fontWeight: '900', color: colors.charcoal },
  age: { fontSize: font.title, fontWeight: '600', color: colors.muted },
  breed: { fontSize: font.body, color: colors.muted, fontWeight: '600' },

  compat: { backgroundColor: colors.forest, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
  compatPct: { color: '#fff', fontWeight: '900', fontSize: font.heading },
  compatLabel: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1, opacity: 0.9 },
  reason: { fontSize: font.body, color: colors.charcoal },
  compatNote: { fontSize: font.tiny, color: colors.faint, lineHeight: 16, marginTop: spacing.xs },

  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fact: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  factLabel: { fontSize: font.tiny, color: colors.faint, fontWeight: '700', textTransform: 'uppercase' },
  factValue: { fontSize: font.body, color: colors.charcoal, fontWeight: '700', textTransform: 'capitalize' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  comfort: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  comfortText: { fontSize: font.small, fontWeight: '700' },

  meetup: { fontSize: font.body, color: colors.charcoal, fontWeight: '600' },
  body: { fontSize: font.body, color: colors.charcoal, lineHeight: 22 },

  warn: { backgroundColor: colors.coralSoft, borderColor: colors.coral },
  warnText: { fontSize: font.body, color: '#B6432F', fontWeight: '600', lineHeight: 21 },

  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ownerAvatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  ownerInitial: { fontSize: font.heading, fontWeight: '800', color: '#3D6A93' },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerName: { fontSize: font.heading, fontWeight: '800', color: colors.charcoal },
  ownerArea: { fontSize: font.small, color: colors.muted, fontWeight: '600' },

  report: { fontSize: 22, color: colors.muted },
  notFound: { fontSize: font.body, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
