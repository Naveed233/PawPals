import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, spacing } from '@/theme';

/**
 * Standard screen shell: safe-area aware, optional title + back button, and an
 * optional scrolling body. Keeps padding and headers consistent everywhere.
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
  const header = (title || onBack || right) && (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
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
          contentContainerStyle={[styles.body, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.bodyFlex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { minWidth: 28, alignItems: 'flex-end' },
  back: { fontSize: 34, color: colors.forest, lineHeight: 34, fontWeight: '300' },
  title: { fontSize: font.heading, fontWeight: '800', color: colors.charcoal },
  subtitle: { fontSize: font.tiny, color: colors.faint, fontWeight: '600' },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  bodyFlex: { flex: 1, padding: spacing.lg },
});
