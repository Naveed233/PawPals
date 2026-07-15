import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeartBurst, Pop } from '@/components/anim';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

export default function MatchCelebration() {
  const router = useRouter();
  const { tx } = useI18n();
  const { dogId } = useLocalSearchParams<{ dogId: string }>();
  const myDog = useStore((s) => s.dogs[0]);
  const dog = SEED_DOGS.find((d) => d.id === dogId);

  const close = () => router.back();

  // Edge case: the matched dog couldn't be resolved. Show a dismissible state
  // rather than navigating during render (which would warn / risk a loop).
  // (A missing OWN dog is fine — pet-less users can match too.)
  if (!dog) {
    return (
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel={tx('閉じる', 'Close')}
        />
        <View style={styles.card}>
          <Text style={styles.title}>
            {tx('このマッチは表示できません', "This match can't be shown")}
          </Text>
          <Button label={tx('閉じる', 'Close')} onPress={close} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={close}
        accessibilityLabel={tx('閉じる', 'Close')}
      />
      <Pop style={styles.card}>
        <Text style={styles.kicker}>{tx('🎉 マッチしました！', "🎉 It's a match!")}</Text>
        <Text style={styles.title}>
          {myDog
            ? tx(
                `${myDog.name}と${dog.name}、お互いに会いたがっています`,
                `${myDog.name} and ${dog.name} want to meet each other`,
              )
            : tx(`${dog.name}とマッチしました！`, `You matched with ${dog.name}!`)}
        </Text>

        <View style={styles.photos}>
          {myDog && (
            <DogPhoto dog={myDog} style={styles.photo} rounded={radius.lg} emojiSize={52} />
          )}
          <View style={styles.heart}>
            <Icon name="heartFill" color={night.pink} size={26} />
          </View>
          <DogPhoto dog={dog} style={styles.photo} rounded={radius.lg} emojiSize={52} />
          <HeartBurst count={12} size={26} emojis={['💗', '💖', '🩷', '💕', '💞']} />
        </View>

        <Text style={styles.body}>
          {tx(
            `${dog.ownerName}さんとミートアップの計画を立てられます。初めて会うときは、必ず犬同伴OKの公共の場所で。`,
            `You can now plan a meetup with ${dog.ownerName}. For a first meeting, always pick a public, dog-friendly spot.`,
          )}
        </Text>

        <View style={{ gap: spacing.md, width: '100%' }}>
          <Button
            label={tx('メッセージを送る', 'Send a message')}
            onPress={() => {
              close();
              router.push(`/chat/${dog.id}`);
            }}
          />
          <Button
            label={tx(`${dog.name}のプロフィールを見る`, `View ${dog.name}'s profile`)}
            variant="outline"
            onPress={() => {
              close();
              router.push(`/dog/${dog.id}`);
            }}
          />
          <Button label={tx('スワイプを続ける', 'Keep swiping')} variant="ghost" onPress={close} />
        </View>
      </Pop>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,2,7,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: night.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: night.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  kicker: { fontSize: font.heading, fontWeight: '900', color: night.pink },
  title: { fontSize: font.title, fontWeight: '900', color: night.text, textAlign: 'center' },
  photos: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  photo: { width: 110, height: 130 },
  heart: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: night.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { fontSize: font.body, color: night.muted, textAlign: 'center', lineHeight: 21 },
});
