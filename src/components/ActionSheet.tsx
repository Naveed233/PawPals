import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/lib/i18n';
import { font, night, radius, shadow, spacing } from '@/theme';

export type SheetAction = {
  key: string;
  label: string;
  sublabel?: string;
  emoji?: string;
  destructive?: boolean;
  onPress: () => void;
};

/**
 * In-app confirmation / action sheet. Replaces window.confirm / Alert on web so
 * the browser (and the app's own domain) never appears in a dialog. Themed to
 * the warm light palette; used for report/block, sign-out, delete-account, etc.
 */
export function ActionSheet({
  visible,
  title,
  message,
  actions,
  onClose,
  closeLabel,
}: {
  visible: boolean;
  title?: string;
  message?: string;
  actions: SheetAction[];
  onClose: () => void;
  closeLabel?: string;
}) {
  const { tx } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          {actions.map((a) => (
            <Pressable
              key={a.key}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={({ pressed }) => [
                styles.action,
                a.destructive && styles.actionDestructive,
                pressed && { opacity: 0.85 },
              ]}
            >
              {!!a.emoji && <Text style={styles.emoji}>{a.emoji}</Text>}
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, a.destructive && { color: night.danger }]}>
                  {a.label}
                </Text>
                {!!a.sublabel && <Text style={styles.actionSub}>{a.sublabel}</Text>}
              </View>
            </Pressable>
          ))}

          <Pressable onPress={onClose} accessibilityRole="button" style={styles.cancel}>
            <Text style={styles.cancelText}>
              {closeLabel ?? (actions.length ? tx('キャンセル', 'Cancel') : tx('閉じる', 'Close'))}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,21,19,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadow.card,
  },
  title: { fontSize: font.title, fontWeight: '900', color: night.text, textAlign: 'center' },
  message: { fontSize: font.small, color: night.muted, lineHeight: 20, textAlign: 'center' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F6F3EE',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#EAE4D8',
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  actionDestructive: { backgroundColor: '#FCEDEA', borderColor: '#F6D6CF' },
  emoji: { fontSize: 22 },
  actionLabel: { fontSize: font.body, fontWeight: '800', color: night.text },
  actionSub: { fontSize: font.tiny, fontWeight: '600', color: night.muted, marginTop: 1 },
  cancel: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
  cancelText: { fontSize: font.small, fontWeight: '700', color: night.muted },
});
