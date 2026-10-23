import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen, DarkField, LimeButton, dark } from '@/components/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

/**
 * Completes a password reset. The email link drops the user here with a
 * recovery session already set by supabase-js (it detects the token in the
 * URL). They pick a new password; updateUser writes it. Without this screen
 * the "Forgot password?" flow was a dead-end (email sent, nowhere to land).
 */
export default function UpdatePassword() {
  const router = useRouter();
  const { tx } = useI18n();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  // Confirm we actually have a recovery session before offering the form —
  // otherwise updateUser would fail and it's clearer to send them to sign-in.
  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive && session) setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    if (password.length < 6) {
      setError(tx('パスワードは6文字以上で入力してください', 'Password must be at least 6 characters'));
      return;
    }
    if (password !== confirm) {
      setError(tx('パスワードが一致しません', 'Passwords do not match'));
      return;
    }
    setError(undefined);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace('/'), 1200);
  };

  return (
    <AuthScreen
      title={tx('新しいパスワード', 'New password')}
      subtitle={
        ready
          ? tx('新しいパスワードを設定してください。', 'Choose a new password for your account.')
          : tx(
              'このリンクは無効か期限切れです。もう一度お試しください。',
              'This link is invalid or expired — please request a new one.',
            )
      }
      footerPrompt={tx('サインインに戻る', 'Back to')}
      footerAction={tx('サインイン', 'Sign in')}
      onFooterPress={() => router.replace('/sign-in')}
    >
      {ready && (
        <>
          <DarkField
            label={tx('新しいパスワード*', 'New password*')}
            value={password}
            onChangeText={setPassword}
            placeholder={tx('6文字以上', 'At least 6 characters')}
            secureToggle
          />
          <DarkField
            label={tx('パスワードの確認*', 'Confirm password*')}
            value={confirm}
            onChangeText={setConfirm}
            placeholder={tx('もう一度入力', 'Re-enter password')}
            secureToggle
            error={error}
          />

          <LimeButton
            label={busy ? tx('更新中…', 'Updating…') : tx('パスワードを更新', 'Update password')}
            onPress={() => void submit()}
            disabled={busy}
          />

          {done && (
            <Text style={styles.done}>
              {tx('パスワードを更新しました。', 'Password updated — signing you in…')}
            </Text>
          )}
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  done: {
    color: dark.lime,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
  },
});
