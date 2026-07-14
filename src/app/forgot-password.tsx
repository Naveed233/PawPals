import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen, DarkField, LimeButton, dark } from '@/components/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!EMAIL_RE.test(email)) {
      setError('有効なメールアドレスを入力してください');
      setSent(false);
      return;
    }
    setError(undefined);
    setSent(true);
  };

  return (
    <AuthScreen
      title="パスワードをお忘れですか？"
      subtitle="メールアドレスを入力してください。確認コードをお送りします。"
      footerPrompt="パスワードを思い出しましたか？"
      footerAction="サインイン"
      onFooterPress={() => router.push('/sign-in')}
    >
      <DarkField
        label="メールアドレス*"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />

      <LimeButton label="コードを送信" onPress={submit} />

      {sent && (
        <Text style={styles.sent}>
          送信しました！（デモ版のため、実際のメールは送信されません）
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
