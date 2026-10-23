import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { loadRemoteState } from '@/lib/sync';
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
  // The server has a session but its profile could not be read. Shown instead
  // of onboarding, which would overwrite the saved profile.
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loadingAccount = false;

    // Hard cap: never let a slow/unreachable Supabase leave the user stuck on
    // the splash. After 6s we proceed with whatever local state we have, or,
    // while a signed-in account is still loading, show the retry screen (the
    // load carries on and replaces it if it succeeds).
    const failsafe = setTimeout(() => {
      if (cancelled) return;
      if (loadingAccount) setLoadFailed(true);
      setRestoring(false);
    }, 6000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = useStore.getState();
        if (data.session && !s.session) {
          loadingAccount = true;
          const remote = await loadRemoteState();
          if (cancelled) return;
          if (remote.status === 'error') {
            setLoadFailed(true);
            return;
          }
          if (remote.status === 'ok') {
            if (remote.owner) useStore.setState({ owner: remote.owner, dogs: remote.dogs });
            s.signIn(data.session.user.email ?? 'user');
          }
          setLoadFailed(false);
        }
      } catch (e) {
        console.warn('[PawPair] session restore failed:', e);
        if (loadingAccount && !cancelled) setLoadFailed(true);
      } finally {
        clearTimeout(failsafe);
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, [attempt]);

  const retry = () => {
    setLoadFailed(false);
    setRestoring(true);
    setAttempt((n) => n + 1);
  };

  const signOutInstead = () => {
    void supabase.auth.signOut();
    useStore.getState().signOut();
    setLoadFailed(false);
  };

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

  if (loadFailed) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>🐾</Text>
        <Text style={styles.title} accessibilityRole="header">
          {tx('読み込みに失敗しました', "Couldn't load your account")}
        </Text>
        <Text style={styles.body}>
          {tx(
            '通信状況を確認して、もう一度お試しください。\nアカウントの内容は変更されていません。',
            'Check your connection and try again.\nNothing on your account has changed.',
          )}
        </Text>
        <View style={styles.actions}>
          <Button label={tx('もう一度試す', 'Try again')} onPress={retry} />
          <Button label={tx('サインアウト', 'Sign out')} variant="ghost" onPress={signOutInstead} />
        </View>
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
    paddingHorizontal: spacing.lg,
  },
  logo: { fontSize: 72 },
  brand: { fontSize: 40, fontWeight: '900', color: night.text, marginTop: spacing.sm },
  tag: { fontSize: font.body, color: night.muted, fontWeight: '600' },
  title: {
    fontSize: font.title,
    fontWeight: '800',
    color: night.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  body: {
    fontSize: font.body,
    color: night.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
  actions: { width: '100%', maxWidth: 320, gap: spacing.sm, marginTop: spacing.xl },
});
