import { Image, ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { dogEmojiFor } from '@/lib/avatars';
import { heroPhoto } from '@/lib/photos';
import { night } from '@/theme';
import type { DisplayPhoto, DogProfile } from '@/types';

/**
 * Renders a dog's hero image: a real photo if one was added, otherwise a
 * night-themed placeholder. Falls back to the placeholder if a real image
 * fails to load.
 */
export function DogPhoto({
  dog,
  style,
  rounded,
  emojiSize,
}: {
  dog: DogProfile;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  emojiSize?: number;
}) {
  return <PhotoView photo={heroPhoto(dog)} seed={dog.id} name={dog.name} style={style} rounded={rounded} emojiSize={emojiSize} />;
}

/** Renders a single DisplayPhoto (real image or placeholder). */
export function PhotoView({
  photo,
  seed,
  name,
  style,
  rounded,
  emojiSize,
}: {
  photo: DisplayPhoto;
  seed: string;
  name: string;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  emojiSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const source = photo.uri ? { uri: photo.uri } : photo.module != null ? photo.module : null;

  if (source && !failed) {
    return (
      <Image
        source={source}
        style={[style as StyleProp<ImageStyle>, rounded != null ? { borderRadius: rounded } : null]}
        contentFit="cover"
        onError={() => setFailed(true)}
        accessibilityLabel={`${name}の写真`}
      />
    );
  }

  return (
    <DarkDogPlaceholder seed={photo.key || seed} name={name} style={style} rounded={rounded} emojiSize={emojiSize} />
  );
}

/**
 * Dark placeholder that matches the night theme: a deep maroon gradient with a
 * deterministic dog emoji. Offline-safe stand-in for real photos.
 */
function DarkDogPlaceholder({
  seed,
  name,
  style,
  rounded,
  emojiSize = 64,
}: {
  seed: string;
  name: string;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  emojiSize?: number;
}) {
  return (
    <LinearGradient
      colors={[night.bgTop, night.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.placeholder, rounded != null ? { borderRadius: rounded } : null, style]}
      accessibilityLabel={`${name}のプレースホルダー画像`}
    >
      <Text style={[styles.emoji, { fontSize: emojiSize }]}>{dogEmojiFor(seed)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  emoji: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
});
