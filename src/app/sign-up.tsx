import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  AuthScreen,
  DarkField,
  LimeButton,
  OrDivider,
  SocialRow,
  dark,
  providerUnavailableNotice,
} from '@/components/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);
  const { lang, tx } = useI18n();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | undefined>();
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (name.trim().length < 1) next.name = tx('お名前を入力してください', 'Enter your name');
    if (!EMAIL_RE.test(email))
      next.email = tx('有効なメールアドレスを入力してください', 'Enter a valid email address');
    if (password.length < 6)
      next.password = tx(
        'パスワードは6文字以上で入力してください',
        'Password must be at least 6 characters',
      );
    setErrors(next);
    setInfo(undefined);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: name.trim() } },
    });
    setBusy(false);

    if (error) {
      const m = error.message.toLowerCase();
      setErrors({
        form: m.includes('already registered')
          ? tx(
              'このメールアドレスは登録済みです。サインインしてください。',
              'This email is already registered — try signing in.',
            )
          : error.message,
      });
      return;
    }

    if (!data.session) {
      // Email confirmation is enabled in Supabase: no session until confirmed.
      setInfo(
        tx(
          '確認メールを送信しました。メール内のリンクをクリックしてから、サインインしてください。',
          'Confirmation email sent — click the link in it, then sign in.',
        ),
      );
      return;
    }

    signIn(email);
    router.replace('/');
  };

  const provider = (name: string) => providerUnavailableNotice(name, lang);

  return (
    <AuthScreen
      title={tx('アカウントを作成', 'Create your account')}
      subtitle={tx(
        '登録して、近くのワンちゃんとの新しい出会いを始めよう。',
        'Sign up and start meeting dogs near you.',
      )}
      footerPrompt={tx('すでにアカウントをお持ちですか？', 'Already have an account?')}
      footerAction={tx('サインイン', 'Sign in')}
      onFooterPress={() => router.push('/sign-in')}
    >
      <DarkField
        label={tx('お名前*', 'Full name*')}
        value={name}
        onChangeText={setName}
        placeholder={tx('山田 太郎', 'Alex Smith')}
        autoComplete="name"
        error={errors.name}
      />
      <DarkField
        label={tx('メールアドレス*', 'Email address*')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />
      <DarkField
        label={tx('パスワード*', 'Password*')}
        value={password}
        onChangeText={setPassword}
        placeholder={tx('6文字以上', 'At least 6 characters')}
        secureToggle
        error={errors.password}
      />

      {!!errors.form && <Text style={styles.formError}>{errors.form}</Text>}
      {!!info && <Text style={styles.info}>{info}</Text>}

      <LimeButton
        label={busy ? tx('登録中…', 'Registering…') : tx('登録する', 'Register')}
        onPress={() => void submit()}
        disabled={busy}
      />

      <OrDivider />

      <SocialRow onGoogle={() => provider('Google')} onApple={() => provider('Apple')} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  formError: { color: dark.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  info: { color: dark.lime, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
});
