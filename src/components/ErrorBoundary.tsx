import { Component, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

/**
 * App-wide crash guard. If any screen throws during render, the user sees a
 * calm recovery screen instead of a blank white page — critical once the app
 * is shared publicly and running on every kind of device/network.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Surface in logs; a real product would report to Sentry/analytics here.
    console.error('[PawPair] render error:', error);
  }

  render() {
    if (this.state.error) {
      return <Fallback onReset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

function Fallback({ onReset }: { onReset: () => void }) {
  // Read the language directly (hooks can't run inside the class boundary).
  const lang = useStore.getState().language ?? 'ja';
  const t = (ja: string, en: string) => (lang === 'ja' ? ja : en);

  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.title}>{t('問題が発生しました', 'Something went wrong')}</Text>
      <Text style={styles.body}>
        {t(
          '一時的なエラーが発生しました。もう一度お試しください。',
          'A temporary error occurred. Please try again.',
        )}
      </Text>
      <Pressable
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel={t('再読み込み', 'Reload')}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.btnText}>{t('再読み込み', 'Reload')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: night.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emoji: { fontSize: 56 },
  title: { fontSize: font.title, fontWeight: '900', color: night.text, textAlign: 'center' },
  body: {
    fontSize: font.body,
    color: night.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: night.pink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: font.body },
});
