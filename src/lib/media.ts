import * as ImagePicker from 'expo-image-picker';

/**
 * Pick a photo from the device library and return its uri (or null if the user
 * cancelled / denied permission). Works on native and web (file input).
 */
export async function pickPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}
