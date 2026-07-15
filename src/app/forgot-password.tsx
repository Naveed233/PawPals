import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen, DarkField, LimeButton, dark } from '@/components/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();
  const { tx } = useI18n();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email)) {
      setError(tx('有効なメールアドレスを入力してください', 'Enter a valid email address'));
      setSent(false);
      return;
    }
    setError(undefined);
    setBusy(true);
    // Sends a real reset email via Supabase. (Completing the reset in-app
    // needs an update-password screen — next phase.)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthScreen
      title={tx('パスワードをお忘れですか？', 'Forgot password?')}
      subtitle={tx(
        'メールアドレスを入力してください。パスワード再設定用のメールをお送りします。',
        "Enter your email and we'll send you a password reset link.",
      )}
      footerPrompt={tx('パスワードを思い出しましたか？', 'Remembered your password?')}
      footerAction={tx('サインイン', 'Sign in')}
      onFooterPress={() => router.push('/sign-in')}
    >
      <DarkField
        label={tx('メールアドレス*', 'Email address*')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />

      <LimeButton
        label={busy ? tx('送信中…', 'Sending…') : tx('再設定メールを送信', 'Send reset email')}
        onPress={() => void submit()}
        disabled={busy}
      />

      {sent && (
        <Text style={styles.sent}>
          {tx(
            '再設定メールを送信しました。受信トレイをご確認ください。',
            'Reset email sent — check your inbox.',
          )}
        </Text>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sent: {
    color: dark.lime,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
  },
});
