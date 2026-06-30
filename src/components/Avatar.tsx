import { Image, ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { dogEmojiFor, gradientFor } from '@/lib/avatars';
import { OWNER_IMAGES } from '@/lib/seedImages';

/**
 * Procedural avatar: a deterministic gradient with either a dog emoji or a
 * person's initial. Offline-safe stand-in for real photos.
 */
export function Avatar({
  seed,
  kind,
  label,
  style,
  rounded,
  emojiSize = 64,
  showLabel = false,
}: {
  seed: string;
  kind: 'dog' | 'person';
  label?: string;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  emojiSize?: number;
  showLabel?: boolean;
}) {
  const [c1, c2] = gradientFor(seed);
  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, rounded != null ? { borderRadius: rounded } : null, style]}
    >
      {kind === 'dog' ? (
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>{dogEmojiFor(seed)}</Text>
      ) : (
        <Text style={[styles.initials, { fontSize: emojiSize * 0.55 }]}>
          {(label || '?').charAt(0).toUpperCase()}
        </Text>
      )}
      {showLabel && !!label && <Text style={styles.label}>{label}</Text>}
    </LinearGradient>
  );
}

/**
 * Owner avatar with priority: uploaded photo (uri) → bundled portrait → initials.
 */
export function OwnerAvatar({
  ownerId,
  name,
  uri,
  style,
  rounded,
  size = 40,
}: {
  ownerId: string;
  name: string;
  uri?: string;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  size?: number;
}) {
  const source = uri ? { uri } : OWNER_IMAGES[ownerId] != null ? OWNER_IMAGES[ownerId] : null;
  if (source) {
    return (
      <Image
        source={source}
        style={[style as StyleProp<ImageStyle>, rounded != null ? { borderRadius: rounded } : null]}
        contentFit="cover"
        accessibilityLabel={`Photo of ${name}`}
      />
    );
  }
  return <PersonAvatar name={name} seed={ownerId} style={style} rounded={rounded} size={size} />;
}

export function PersonAvatar({
  name,
  seed,
  style,
  rounded,
  size = 40,
}: {
  name: string;
  seed?: string;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  size?: number;
}) {
  return (
    <Avatar
      seed={seed || name}
      kind="person"
      label={name}
      style={style}
      rounded={rounded}
      emojiSize={size}
    />
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  emoji: { textShadowColor: 'rgba(0,0,0,0.12)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } },
  initials: { color: '#fff', fontWeight: '900' },
  label: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
