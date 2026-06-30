import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    signIn(email);
    router.replace('/');
  };

  const mockProvider = (name: string) => {
    Alert.alert(
      `${name} sign-in (demo)`,
      `Real ${name} login needs developer credentials and isn't wired in this prototype. Signing you in locally instead.`,
      [
        {
          text: 'Continue',
          onPress: () => {
            signIn(`demo@${name.toLowerCase()}.pawpair`);
            router.replace('/');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={styles.brand}>PawPair</Text>
          <Text style={styles.tagline}>
            Playdates, walks, meetups, and events for your dog — and new friends for you.
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            error={errors.password}
          />

          <Button label="Sign in / Create account" onPress={submit} />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>

          <Button label="Continue with Google" variant="outline" onPress={() => mockProvider('Google')} />
          <Button label="Continue with Apple" variant="outline" onPress={() => mockProvider('Apple')} />

          <Text style={styles.note}>
            Demo build: accounts are stored locally on this device. No real server or password
            check is involved.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.xs },
  logo: { fontSize: 64 },
  brand: { fontSize: 40, fontWeight: '900', color: colors.forest },
  tagline: {
    fontSize: font.body,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  form: { gap: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.faint, fontWeight: '700', fontSize: font.small },
  note: {
    fontSize: font.tiny,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
