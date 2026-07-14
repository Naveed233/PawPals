import { StyleSheet, Switch, Text, View } from 'react-native';

import { Chip } from '@/components/ui';
import { font, night, spacing } from '@/theme';

/**
 * Single- or multi-select chip group with a label.
 * `format` maps a stored (English) value to its display label — pass a jp()
 * wrapper to render Japanese while keeping stored values unchanged.
 */
export function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
  error,
  format,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  error?: string;
  format?: (value: T) => string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <Chip
            key={opt}
            label={format ? format(opt) : capitalize(opt)}
            selected={selected.includes(opt)}
            onPress={() => onToggle(opt)}
          />
        ))}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: night.pink, false: night.surfaceHi }}
        thumbColor="#fff"
        accessibilityLabel={label}
      />
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  label: { fontSize: font.small, fontWeight: '700', color: night.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { fontSize: font.tiny, color: night.danger, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: { fontSize: font.body, color: night.text, fontWeight: '600', flex: 1 },
});
