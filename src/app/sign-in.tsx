import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AuthScreen,
  AuthCheckbox,
  AuthField,
  AuthButton,
  OrDivider,
  SocialRow,
  authColors,
  providerSignIn,
} from '@/components/auth';
import { useI18n } from '@/lib/i18n';
import { setRememberSession, supabase } from '@/lib/supabase';
import { loadRemoteState } from '@/lib/sync';
import { useStore } from '@/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);
  const { lang, tx } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email))
      next.email = tx('有効なメールアドレスを入力してください', 'Enter a valid email address');
    if (password.length < 6)
      next.password = tx(
        'パスワードは6文字以上で入力してください',
        'Password must be at least 6 characters',
      );
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    // Honour "remember me" before the token is written (web: localStorage vs
    // sessionStorage) so a shared device doesn't stay signed in.
    setRememberSession(remember);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      const m = error.message.toLowerCase();
      setErrors({
        form: m.includes('invalid')
          ? tx('メールアドレスまたはパスワードが違います', 'Incorrect email or password')
          : m.includes('confirm')
            ? tx(
                'メールが確認されていません。受信トレイをご確認ください。',
                'Email not confirmed yet — check your inbox.',
              )
            : error.message,
      });
      return;
    }

    // Pull the profile/dogs this account saved before (any device). If that
    // read fails, stay here: carrying on would land on onboarding, and
    // finishing onboarding overwrites the saved profile.
    const remote = await loadRemoteState();
    if (remote.status !== 'ok') {
      setBusy(false);
      setErrors({
        form: tx(
          'プロフィールを読み込めませんでした。\n通信状況を確認して、もう一度お試しください。',
          "Your profile didn't load.\nCheck your connection and try again.",
        ),
      });
      return;
    }
    if (remote.owner) useStore.setState({ owner: remote.owner, dogs: remote.dogs });
    signIn(email);
    setBusy(false);
    router.replace('/');
  };

  const provider = (name: 'google' | 'apple') => void providerSignIn(name, lang);

  return (
    <AuthScreen
      title={tx('おかえりなさい！', 'Welcome back!')}
      subtitle={tx(
        'サインインして、愛犬にぴったりの遊び友達を見つけよう。',
        'Sign in to find the perfect playmates for your dog.',
      )}
      footerPrompt={tx('アカウントをお持ちでないですか？', "Don't have an account?")}
      footerAction={tx('新規登録', 'Sign up')}
      onFooterPress={() => router.push('/sign-up')}
    >
      <AuthField
        label={tx('メールアドレス*', 'Email address*')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />
      <AuthField
        label={tx('パスワード*', 'Password*')}
        value={password}
        onChangeText={setPassword}
        placeholder={tx('6文字以上', 'At least 6 characters')}
        secureToggle
        error={errors.password}
      />

      <View style={styles.row}>
        <AuthCheckbox
          checked={remember}
          onToggle={() => setRemember((r) => !r)}
          label={tx('ログイン状態を保持', 'Remember me')}
        />
        <Text
          accessibilityRole="link"
          style={styles.forgot}
          onPress={() => router.push('/forgot-password')}
        >
          {tx('パスワードをお忘れですか？', 'Forgot password?')}
        </Text>
      </View>

      {!!errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <AuthButton
        label={busy ? tx('サインイン中…', 'Signing in…') : tx('サインイン', 'Sign in')}
        onPress={() => void submit()}
        disabled={busy}
      />

      <OrDivider />

      <SocialRow onGoogle={() => provider('google')} onApple={() => provider('apple')} />

      <Text style={styles.note}>
        {tx(
          'アカウントとプロフィールは安全に保存され、どの端末からでもサインインできます。',
          'Your account and profile are stored securely — sign in from any device.',
        )}
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  forgot: { color: authColors.text, fontSize: 13, fontWeight: '700' },
  formError: { color: authColors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  note: {
    color: authColors.sub,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
  },
});
