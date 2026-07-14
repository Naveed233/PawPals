import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  AuthScreen,
  DarkField,
  LimeButton,
  OrDivider,
  SocialRow,
  demoProviderSignIn,
} from '@/components/auth';
import { useStore } from '@/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (name.trim().length < 1) next.name = 'お名前を入力してください';
    if (!EMAIL_RE.test(email)) next.email = '有効なメールアドレスを入力してください';
    if (password.length < 6) next.password = 'パスワードは6文字以上で入力してください';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    signIn(email);
    router.replace('/');
  };

  const provider = (name: string) =>
    demoProviderSignIn(name, () => {
      signIn(`demo@${name.toLowerCase()}.pawpair`);
      router.replace('/');
    });

  return (
    <AuthScreen
      title="アカウントを作成"
      subtitle="登録して、近くのワンちゃんとの新しい出会いを始めよう。"
      footerPrompt="すでにアカウントをお持ちですか？"
      footerAction="サインイン"
      onFooterPress={() => router.push('/sign-in')}
    >
      <DarkField
        label="お名前*"
        value={name}
        onChangeText={setName}
        placeholder="山田 太郎"
        autoComplete="name"
        error={errors.name}
      />
      <DarkField
        label="メールアドレス*"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />
      <DarkField
        label="パスワード*"
        value={password}
        onChangeText={setPassword}
        placeholder="6文字以上"
        secureToggle
        error={errors.password}
      />

      <LimeButton label="登録する" onPress={submit} />

      <OrDivider />

      <SocialRow onGoogle={() => provider('Google')} onApple={() => provider('Apple')} />
    </AuthScreen>
  );
}
