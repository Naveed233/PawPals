import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/lib/i18n';
import { useTabBarClearance } from '@/lib/layout';
import { font, night, spacing } from '@/theme';

/**
 * Standard screen shell (night theme): safe-area aware, optional title + back
 * button, optional scrolling body. Bottom padding clears the floating tab bar.
 */
export function Screen({
  children,
  title,
  subtitle,
  onBack,
  right,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  scroll?: boolean;
  contentStyle?: object;
}) {
  const { tx } = useI18n();
  const tabClearance = useTabBarClearance();
  const header = (title || onBack || right) && (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={tx('戻る', 'Back')}
          hitSlop={12}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
      ) : (
        <View style={{ width: 28 }} />
      )}
      <View style={styles.headerCenter}>
        {!!title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.headerRight}>{right ?? <View style={{ width: 28 }} />}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: tabClearance + spacing.lg }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.bodyFlex, { paddingBottom: tabClearance }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: night.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { minWidth: 28, alignItems: 'flex-end' },
  back: { fontSize: 34, color: night.text, lineHeight: 34, fontWeight: '300' },
  title: { fontSize: font.heading, fontWeight: '800', color: night.text },
  subtitle: { fontSize: font.tiny, color: night.faint, fontWeight: '600' },
  // paddingBottom is applied inline from useTabBarClearance() so every screen
  // clears the floating tab bar on any device.
  body: { padding: spacing.lg, gap: spacing.lg },
  bodyFlex: { flex: 1, padding: spacing.lg },
});
