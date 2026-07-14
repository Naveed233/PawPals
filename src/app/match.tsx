import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeartBurst, Pop } from '@/components/anim';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

export default function MatchCelebration() {
  const router = useRouter();
  const { dogId } = useLocalSearchParams<{ dogId: string }>();
  const myDog = useStore((s) => s.dogs[0]);
  const dog = SEED_DOGS.find((d) => d.id === dogId);

  const close = () => router.back();

  // Edge case: the matched dog couldn't be resolved. Show a dismissible state
  // rather than navigating during render (which would warn / risk a loop).
  if (!dog || !myDog) {
    return (
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="閉じる" />
        <View style={styles.card}>
          <Text style={styles.title}>このマッチは表示できません</Text>
          <Button label="閉じる" onPress={close} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="閉じる" />
      <Pop style={styles.card}>
        <Text style={styles.kicker}>🎉 マッチしました！</Text>
        <Text style={styles.title}>
          {myDog.name}と{dog.name}、お互いに会いたがっています
        </Text>

        <View style={styles.photos}>
          <DogPhoto dog={myDog} style={styles.photo} rounded={radius.lg} emojiSize={52} />
          <View style={styles.heart}>
            <Icon name="heartFill" color={night.pink} size={26} />
          </View>
          <DogPhoto dog={dog} style={styles.photo} rounded={radius.lg} emojiSize={52} />
          <HeartBurst count={12} size={26} emojis={['💗', '💖', '🩷', '💕', '💞']} />
        </View>

        <Text style={styles.body}>
          {dog.ownerName}さんとミートアップの計画を立てられます。初めて会うときは、必ず犬同伴OKの公共の場所で。
        </Text>

        <View style={{ gap: spacing.md, width: '100%' }}>
          <Button
            label="メッセージを送る"
            onPress={() => {
              close();
              router.push(`/chat/${dog.id}`);
            }}
          />
          <Button
            label={`${dog.name}のプロフィールを見る`}
            variant="outline"
            onPress={() => {
              close();
              router.push(`/dog/${dog.id}`);
            }}
          />
          <Button label="スワイプを続ける" variant="ghost" onPress={close} />
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
