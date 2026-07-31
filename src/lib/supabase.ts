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

/*
 * "Remember me" (web). When ON, the auth token lives in localStorage and
 * survives closing the browser. When OFF, it lives in sessionStorage — it
 * survives a refresh but is wiped when the tab/browser closes, so a shared
 * device doesn't stay signed in. The preference itself sits in localStorage so
 * the storage adapter knows where to read on the next visit.
 */
const REMEMBER_KEY = 'pawpair.remember';

function isWebClient() {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

/** Persist the "remember me" choice. Call before signing in. Web-only effect. */
export function setRememberSession(remember: boolean) {
  if (!isWebClient()) return;
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  } catch {
    /* storage disabled (private mode) — sessions just won't persist */
  }
}

function rememberOn(): boolean {
  if (!isWebClient()) return true;
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
}

// Routes the Supabase auth token to localStorage (remembered) or sessionStorage
// (this-session-only), keeping exactly one copy so switching modes is clean.
const rememberAwareWebStorage = {
  getItem: (key: string) => {
    try {
      return rememberOn()
        ? window.localStorage.getItem(key)
        : window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (rememberOn()) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: isServer
    ? { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    : {
        storage: isWebClient() ? rememberAwareWebStorage : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Web only: lets OAuth redirects (Google/Apple) complete — the
        // session arrives in the URL hash after the provider round-trip.
        detectSessionInUrl: Platform.OS === 'web',
      },
});
