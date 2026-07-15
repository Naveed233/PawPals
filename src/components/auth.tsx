import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/LanguageToggle';
import { type Lang, txFor, useI18n } from '@/lib/i18n';

/*
 * Shared building blocks for the dark auth screens (sign-in / sign-up /
 * forgot-password). Local dark palette — the rest of the app keeps the
 * light theme from src/theme.ts.
 */

export const dark = {
  bg: '#0B0B09',
  bgTop: '#181B0E',
  input: '#131310',
  border: '#2A2A23',
  text: '#FFFFFF',
  sub: '#A3A399',
  placeholder: '#6E6E64',
  lime: '#D9F24F',
  limeText: '#161605',
  danger: '#FF8973',
} as const;

const DOGS = require('@/assets/images/login-dogs.jpg');

const svg = (body: string) => ({
  uri: 'data:image/svg+xml;utf8,' + encodeURIComponent(body),
});

// Official brand marks + feather-style eye icons, inlined so there are no
// extra deps or network fetches. Apple mark is white for the dark theme.
const GOOGLE_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>',
);
const APPLE_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFFFFF" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
);
const EYE_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8A8A80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
);
const EYE_OFF_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8A8A80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
);

/** Scaffold: black gradient bg, back button, circular dog photo, title/sub. */
export function AuthScreen({
  title,
  subtitle,
  children,
  footerPrompt,
  footerAction,
  onFooterPress,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerPrompt?: string;
  footerAction?: string;
  onFooterPress?: () => void;
}) {
  const router = useRouter();
  const { tx } = useI18n();
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[dark.bgTop, dark.bg]}
        locations={[0, 0.42]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.flex}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.content}>
              {router.canGoBack() && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tx('戻る', 'Back')}
                  onPress={() => router.back()}
                  style={({ pressed }) => [s.back, pressed && s.pressed]}
                >
                  <Text style={s.backArrow}>←</Text>
                </Pressable>
              )}

              <LanguageToggle style={s.langToggle} />

              <View style={s.photoRing}>
                <Image
                  source={DOGS}
                  style={s.photo}
                  contentFit="cover"
                  accessibilityLabel={tx('公園で遊ぶ2匹の犬', 'Two dogs playing in a park')}
                />
              </View>

              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>

              <View style={s.form}>{children}</View>

              <View style={s.flex} />

              {footerPrompt != null && (
                <Text style={s.footer}>
                  {footerPrompt}{' '}
                  <Text accessibilityRole="link" style={s.footerLink} onPress={onFooterPress}>
                    {footerAction}
                  </Text>
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/** Dark text field with label, optional error and password-eye toggle. */
export function DarkField({
  label,
  error,
  secureToggle,
  ...props
}: TextInputProps & { label: string; error?: string; secureToggle?: boolean }) {
  const [hidden, setHidden] = useState(true);
  const { tx } = useI18n();
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View>
        <TextInput
          placeholderTextColor={dark.placeholder}
          {...props}
          secureTextEntry={secureToggle ? hidden : props.secureTextEntry}
          style={[s.input, !!error && s.inputError, !!secureToggle && s.inputWithIcon]}
        />
        {secureToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hidden ? tx('パスワードを表示', 'Show password') : tx('パスワードを隠す', 'Hide password')
            }
            onPress={() => setHidden((h) => !h)}
            style={({ pressed }) => [s.eyeBtn, pressed && s.pressed]}
          >
            <Image
              source={hidden ? EYE_OFF_ICON : EYE_ICON}
              style={s.eyeIcon}
              contentFit="contain"
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

/** Primary lime pill button. */
export function LimeButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.lime, disabled && s.limeDisabled, pressed && s.pressed]}
    >
      <Text style={s.limeText}>{label}</Text>
    </Pressable>
  );
}

/** Small square checkbox with label ("remember me"). */
export function DarkCheckbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [s.checkRow, pressed && s.pressed]}
    >
      <View style={[s.checkbox, checked && s.checkboxOn]}>
        {checked && <Text style={s.checkmark}>✓</Text>}
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </Pressable>
  );
}

/** "または" / "or" divider. */
export function OrDivider() {
  const { tx } = useI18n();
  return (
    <View style={s.divider}>
      <View style={s.line} />
      <Text style={s.or}>{tx('または', 'or')}</Text>
      <View style={s.line} />
    </View>
  );
}

/** Google / Apple pills with real logos. */
export function SocialRow({
  onGoogle,
  onApple,
}: {
  onGoogle: () => void;
  onApple: () => void;
}) {
  const { tx } = useI18n();
  return (
    <View style={s.socialRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tx('Googleで続ける', 'Continue with Google')}
        onPress={onGoogle}
        style={({ pressed }) => [s.socialBtn, pressed && s.pressed]}
      >
        <Image source={GOOGLE_ICON} style={s.socialIcon} contentFit="contain" />
        <Text style={s.socialText}>Google</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tx('Appleで続ける', 'Continue with Apple')}
        onPress={onApple}
        style={({ pressed }) => [s.socialBtn, pressed && s.pressed]}
      >
        <Image source={APPLE_ICON} style={s.socialIcon} contentFit="contain" />
        <Text style={s.socialText}>Apple</Text>
      </Pressable>
    </View>
  );
}

/**
 * Google/Apple OAuth needs provider credentials configured in Supabase —
 * until then the buttons explain themselves instead of faking a session.
 */
export function providerUnavailableNotice(name: string, lang: Lang) {
  const tx = txFor(lang);
  const msg = tx(
    `${name}ログインはまだ設定されていません。メールアドレスでご登録ください。`,
    `${name} sign-in isn't set up yet. Please use email instead.`,
  );
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(msg);
  } else {
    Alert.alert(tx('未設定', 'Not available yet'), msg);
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: dark.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 12 },
  content: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center' },

  langToggle: {
    position: 'absolute',
    right: 0,
    top: 4,
    zIndex: 2,
  },
  back: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  backArrow: { color: dark.text, fontSize: 19, lineHeight: 22 },
  pressed: { opacity: 0.6 },

  photoRing: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 4,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(217,242,79,0.25)',
  },
  photo: { width: 104, height: 104, borderRadius: 52 },

  title: {
    color: dark.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 22,
  },
  subtitle: {
    color: dark.sub,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  form: { marginTop: 26, gap: 16 },

  fieldWrap: { gap: 8 },
  label: { color: dark.text, fontSize: 13, fontWeight: '700' },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dark.border,
    backgroundColor: dark.input,
    color: dark.text,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  inputWithIcon: { paddingRight: 48 },
  inputError: { borderColor: dark.danger },
  error: { color: dark.danger, fontSize: 12 },
  eyeBtn: {
    position: 'absolute',
    right: 4,
    top: 0,
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: { width: 20, height: 20 },

  lime: {
    height: 54,
    borderRadius: 999,
    backgroundColor: dark.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  limeDisabled: { opacity: 0.55 },
  limeText: { color: dark.limeText, fontSize: 16, fontWeight: '800' },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#4A4A40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: dark.lime, borderColor: dark.lime },
  checkmark: { color: dark.limeText, fontSize: 13, fontWeight: '900', lineHeight: 15 },
  checkLabel: { color: dark.text, fontSize: 13 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: dark.border },
  or: { color: dark.sub, fontSize: 13 },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialIcon: { width: 18, height: 18 },
  socialText: { color: dark.text, fontSize: 14, fontWeight: '700' },

  footer: { color: dark.sub, fontSize: 13, textAlign: 'center', marginTop: 28 },
  footerLink: { color: dark.text, fontWeight: '800' },
});
