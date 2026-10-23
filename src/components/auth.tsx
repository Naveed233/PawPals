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

import { Icon } from '@/components/icons';
import { LanguageToggle } from '@/components/LanguageToggle';
import { type Lang, txFor, useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { radius, shadow, tone } from '@/theme';

/*
 * Shared building blocks for the auth screens (sign-in / sign-up /
 * forgot-password / update-password), in the same light world as the app:
 * sky ground, white print surfaces, ink text, the action colour for the
 * primary button.
 */

export const authColors = {
  bg: tone.ground,
  bgTop: tone.groundTop,
  input: tone.print,
  border: tone.printEdge,
  text: tone.ink,
  sub: tone.inkMuted,
  placeholder: tone.inkFaint,
  action: tone.action,
  onAction: tone.onAction,
  link: tone.accentInk,
  danger: tone.danger,
} as const;

// The welcome photo, cropped square to its lower half where the dogs are.
const DOGS = require('@/assets/images/welcome-bg.jpg');

const svg = (body: string) => ({
  uri: 'data:image/svg+xml;utf8,' + encodeURIComponent(body),
});

// Official brand marks + feather-style eye icons, inlined so there are no
// extra deps or network fetches. Apple mark is white, on the ink Apple button.
const GOOGLE_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>',
);
const APPLE_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFFFFF" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
);
const EYE_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4B5670" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
);
const EYE_OFF_ICON = svg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4B5670" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
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
      <StatusBar style="dark" />
      <LinearGradient
        colors={[authColors.bgTop, authColors.bg]}
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
              {/* Back and language sit in their own row, so they never cover the print. */}
              <View style={s.topBar}>
                {router.canGoBack() ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={tx('戻る', 'Back')}
                    onPress={() => router.back()}
                    style={({ pressed }) => [s.back, pressed && s.pressed]}
                  >
                    <Icon name="arrowLeft" color={authColors.text} size={20} />
                  </Pressable>
                ) : (
                  <View style={s.backSpacer} />
                )}
                <LanguageToggle />
              </View>

              <View style={s.photoRing}>
                <Image
                  source={DOGS}
                  style={s.photo}
                  contentFit="cover"
                  contentPosition="bottom"
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

/** Text field with label, optional error and password-eye toggle. */
export function AuthField({
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
          placeholderTextColor={authColors.placeholder}
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

/** Primary pill button in the action colour. */
export function AuthButton({
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
      style={({ pressed }) => [s.action, disabled && s.actionDisabled, pressed && s.pressed]}
    >
      <Text style={s.actionText}>{label}</Text>
    </Pressable>
  );
}

/** Small square checkbox with label ("remember me"). */
export function AuthCheckbox({
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
        {checked && <Icon name="check" color={authColors.onAction} size={13} strokeWidth={3.5} />}
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
        style={({ pressed }) => [s.socialBtn, s.appleBtn, pressed && s.pressed]}
      >
        <Image source={APPLE_ICON} style={s.socialIcon} contentFit="contain" />
        <Text style={[s.socialText, s.appleText]}>Apple</Text>
      </Pressable>
    </View>
  );
}

/**
 * Google/Apple sign-in through Supabase.
 *  - Web: OAuth redirect flow (pre-flighted so an unconfigured provider shows
 *    a friendly message instead of a raw error page).
 *  - iOS: native Sign in with Apple (required by the App Store) via
 *    expo-apple-authentication; Google via an in-app browser + deep link.
 *  - Android: Google via in-app browser + deep link.
 * Native modules are dynamically imported so they never affect the web bundle.
 */
export async function providerSignIn(provider: 'google' | 'apple', lang: Lang) {
  const tx = txFor(lang);
  const label = provider === 'google' ? 'Google' : 'Apple';
  const notReady = tx(
    `${label}ログインはまだ設定されていません。メールアドレスでご登録ください。`,
    `${label} sign-in isn't set up yet. Please use email instead.`,
  );
  const notify = (msg: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert(tx('サインイン', 'Sign in'), msg);
    }
  };

  // ---------------------------------------------------------------- web
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          window.location.origin +
          (window.location.pathname.startsWith('/PawPals') ? '/PawPals/' : '/'),
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      notify(error?.message ?? notReady);
      return;
    }
    try {
      const probe = await fetch(data.url, { redirect: 'manual' });
      if (probe.type !== 'opaqueredirect' && !probe.ok) {
        notify(notReady);
        return;
      }
    } catch {
      // Probe blocked (CORS) — proceed; the provider page will explain if off.
    }
    window.location.assign(data.url);
    return;
  }

  // ------------------------------------------------- iOS native Apple
  if (provider === 'apple' && Platform.OS === 'ios') {
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) {
        notify(notReady);
        return;
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: cred.identityToken,
      });
      if (error) notify(error.message);
    } catch (e) {
      // User-cancel throws ERR_REQUEST_CANCELED — treat as a no-op.
      const code = (e as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED') notify(notReady);
    }
    return;
  }

  // --------------------------- native Google (+ Apple on Android) via browser
  try {
    const WebBrowser = await import('expo-web-browser');
    const redirectTo = 'pawpair://auth-callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      notify(error?.message ?? notReady);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return;
    const url = result.url;
    const frag = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
    const params = new URLSearchParams(frag);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    } else {
      notify(notReady);
    }
  } catch {
    notify(notReady);
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: authColors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 12 },
  content: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 4,
  },
  backSpacer: { width: 44, height: 44 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: authColors.input,
    borderWidth: 1,
    borderColor: authColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },

  // The welcome photo as a small instant print, slightly turned.
  photoRing: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
    paddingBottom: 24,
    borderRadius: radius.print,
    backgroundColor: authColors.input,
    transform: [{ rotate: '-3deg' }],
    ...shadow.print,
  },
  photo: { width: 112, height: 112, borderRadius: 3 },

  title: {
    color: authColors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 22,
  },
  subtitle: {
    color: authColors.sub,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  form: { marginTop: 26, gap: 16 },

  fieldWrap: { gap: 8 },
  label: { color: authColors.text, fontSize: 13, fontWeight: '700' },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: authColors.input,
    color: authColors.text,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  inputWithIcon: { paddingRight: 48 },
  inputError: { borderColor: authColors.danger },
  error: { color: authColors.danger, fontSize: 12 },
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

  action: {
    height: 54,
    borderRadius: 999,
    backgroundColor: authColors.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  actionDisabled: { opacity: 0.55 },
  actionText: { color: authColors.onAction, fontSize: 16, fontWeight: '800' },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: authColors.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: authColors.action, borderColor: authColors.action },
  checkLabel: { color: authColors.text, fontSize: 13 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: authColors.border },
  or: { color: authColors.sub, fontSize: 13 },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: authColors.input,
    borderWidth: 1,
    borderColor: authColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialIcon: { width: 18, height: 18 },
  socialText: { color: authColors.text, fontSize: 14, fontWeight: '700' },
  appleBtn: { backgroundColor: authColors.text, borderColor: authColors.text },
  appleText: { color: '#FFFFFF' },

  footer: { color: authColors.sub, fontSize: 13, textAlign: 'center', marginTop: 28 },
  footerLink: { color: authColors.link, fontWeight: '800' },
});
