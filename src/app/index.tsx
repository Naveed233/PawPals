import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { fetchRemoteState } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';

/**
 * Entry point. Acts as splash + router: waits for persisted state to hydrate,
 * restores a Supabase session (and the account's server-side profile/dogs) if
 * one exists, then routes by onboarding progress.
 */
export default function Index() {
  const { tx } = useI18n();
  const hydrated = useStore((s) => s._hasHydrated);
  const session = useStore((s) => s.session);
  const owner = useStore((s) => s.owner);
  const dogCount = useStore((s) => s.dogs.length);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Hard cap: never let a slow/unreachable Supabase leave the user stuck on
    // the splash. After 6s we proceed with whatever local state we have.
    const failsafe = setTimeout(() => {
      if (!cancelled) setRestoring(false);
    }, 6000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = useStore.getState();
        if (data.session && !s.session) {
          const remote = await fetchRemoteState();
          if (cancelled) return;
          if (remote?.owner) useStore.setState({ owner: remote.owner, dogs: remote.dogs });
          s.signIn(data.session.user.email ?? 'user');
        }
      } catch (e) {
        console.warn('[PawPair] session restore failed:', e);
      } finally {
        clearTimeout(failsafe);
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, []);

  if (!hydrated || restoring) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>🐾</Text>
        <Text style={styles.brand}>PawPair</Text>
        <Text style={styles.tag}>{tx('ワンちゃんの出会いアプリ', 'Where dogs make new friends')}</Text>
        <ActivityIndicator color={night.pink} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  if (!session) return <Redirect href="/welcome" />;
  if (!owner) return <Redirect href="/onboarding/owner" />;
  const petStatus = owner.petStatus ?? 'has-dog';
  if (dogCount === 0 && petStatus === 'has-dog') return <Redirect href="/onboarding/dog" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: night.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: 72 },
  brand: { fontSize: 40, fontWeight: '900', color: night.text, marginTop: spacing.sm },
  tag: { fontSize: font.body, color: night.muted, fontWeight: '600' },
});
