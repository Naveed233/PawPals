import { Image, ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { heroPhoto } from '@/lib/photos';
import type { DisplayPhoto, DogProfile } from '@/types';

/**
 * Renders a dog's hero image: a real photo if one was added, otherwise the
 * procedural avatar. Falls back to the avatar if a real image fails to load.
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

/** Renders a single DisplayPhoto (real image or placeholder avatar). */
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
        accessibilityLabel={`Photo of ${name}`}
      />
    );
  }

  return <Avatar seed={photo.key || seed} kind="dog" label={name} style={style} rounded={rounded} emojiSize={emojiSize} />;
}
