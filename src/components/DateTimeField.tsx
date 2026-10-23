import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTimeSheet } from '@/components/DateTimeSheet';
import { Icon } from '@/components/icons';
import { formatDay, formatTime, parseLocal } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { font, night, radius, spacing } from '@/theme';

/**
 * Date + time field for forms. Looks like the other inputs; tapping it opens
 * DateTimeSheet (a month calendar, then a scrolling time drum) on every
 * platform, instead of the browser's own datetime input. The value is the
 * local datetime string "YYYY-MM-DDTHH:MM" ("" until something is picked).
 */
export function DateTimeField({
  label,
  value,
  onChange,
  min,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  error?: string;
}) {
  const { lang, tx } = useI18n();
  const [open, setOpen] = useState(false);
  const parts = parseLocal(value);
  const shown = parts
    ? `${formatDay(lang, parts.y, parts.m, parts.d)}  ${formatTime(lang, parts.hh, parts.mm)}`
    : null;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${shown ?? tx('未選択', 'not set')}`}
        accessibilityHint={tx('カレンダーと時間を開きます', 'Opens a calendar and time picker')}
        style={({ pressed }) => [styles.field, !!error && styles.fieldError, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.iconDisc}>
          <Icon name="calendar" color={night.coralDeep} size={18} />
        </View>
        <Text style={[styles.value, !shown && styles.placeholder]} numberOfLines={1}>
          {shown ?? tx('日付と時間を選ぶ', 'Choose a date and time')}
        </Text>
        <Icon name="chevronRight" color={night.muted} size={18} />
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}

      {open && (
        <DateTimeSheet
          value={value}
          min={min}
          onClose={() => setOpen(false)}
          onDone={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.small, fontWeight: '700', color: night.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: night.input,
    borderWidth: 1.5,
    borderColor: night.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  fieldError: { borderColor: night.danger },
  iconDisc: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: night.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { flex: 1, fontSize: font.body, fontWeight: '700', color: night.text },
  placeholder: { fontWeight: '600', color: night.faint },
  error: { color: night.danger, fontSize: font.tiny, fontWeight: '600' },
});
