import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * Supabase client.
 *
 * The publishable (anon) key is safe to ship in the bundle by design — all
 * data access is enforced by Row Level Security in supabase/schema.sql.
 * The SECRET key must never appear anywhere in this repo or bundle.
 */
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zuizenbzncstqzfrnpsy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_gvrmL_A0XQHpfA2zea1QvQ_ndD1uQGT';

// Expo Router statically pre-renders web routes in Node, where there is no
// localStorage — session persistence must be off there or the render crashes.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: isServer
    ? { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    : {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
});
