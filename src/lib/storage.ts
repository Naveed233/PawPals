import { supabase } from '@/lib/supabase';

/**
 * Upload a locally-picked image (file:// or blob:/data: on web) to the public
 * `photos` bucket and return its public URL. Files live under the user's own
 * folder (uid/…) so the storage RLS policy accepts the write.
 *
 * Returns null on any failure — callers keep the local uri as a fallback so
 * the UI never breaks, it just won't persist across devices.
 */
export async function uploadPhoto(localUri: string): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return null;

    const res = await fetch(localUri);
    const blob = await res.blob();

    const type = blob.type || 'image/jpeg';
    if (!type.startsWith('image/')) return null;
    // 10 MB cap mirrors the bucket policy — room for HD photos.
    if (blob.size > 10 * 1024 * 1024) return null;

    const ext = type.split('/')[1]?.split('+')[0] || 'jpg';
    // Unique-ish name without Date.now (blocked in some contexts) — random + size.
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${uid}/${rand}-${blob.size}.${ext}`;

    const { error } = await supabase.storage.from('photos').upload(path, blob, {
      contentType: type,
      upsert: false,
    });
    if (error) {
      console.warn('[storage] upload failed:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch (e) {
    console.warn('[storage] upload failed:', e);
    return null;
  }
}
