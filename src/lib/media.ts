import * as ImagePicker from 'expo-image-picker';

import { uploadPhoto } from '@/lib/storage';

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
    quality: 1, // full quality — HD photos
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

/**
 * Pick a photo and upload it to storage, returning the public URL so it
 * persists across devices. Falls back to the local uri if the upload fails
 * (offline / not signed in) so the picker never appears broken.
 */
export async function pickAndUploadPhoto(): Promise<string | null> {
  const uri = await pickPhoto();
  if (!uri) return null;
  const url = await uploadPhoto(uri);
  return url ?? uri;
}
