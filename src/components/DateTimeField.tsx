import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { font, night, radius, spacing } from '@/theme';

/**
 * A real date+time picker. On web (our iPhone-Safari launch target) this
 * renders a native `<input type="datetime-local">`, so users get the OS wheel
 * picker instead of typing a label. The value is the local datetime string
 * "YYYY-MM-DDTHH:MM". On native it degrades to a plain text field with the
 * same value shape (the native build can swap in a wheel picker later).
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
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'web'
        ? React.createElement('input', {
            type: 'datetime-local',
            value,
            min,
            onChange: (e: { target: { value: string } }) => onChange(e.target.value),
            style: { ...webInput, ...(error ? { borderColor: night.danger } : null) },
          })
        : (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="2026-07-25T10:00"
            placeholderTextColor={night.faint}
            style={[styles.nativeInput, !!error && { borderColor: night.danger }]}
          />
        )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

// Plain CSS object for the DOM input (react-native-web renders it as-is).
const webInput: Record<string, string> = {
  backgroundColor: night.input,
  color: night.text,
  border: `1.5px solid ${night.border}`,
  borderRadius: `${radius.md}px`,
  padding: `${spacing.md}px ${spacing.lg}px`,
  fontSize: `${font.body}px`,
  fontFamily: 'inherit',
  colorScheme: 'dark',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const styles = StyleSheet.create({
  label: { fontSize: font.small, fontWeight: '700', color: night.text },
  nativeInput: {
    backgroundColor: night.input,
    borderWidth: 1.5,
    borderColor: night.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: night.text,
  },
  error: { color: night.danger, fontSize: font.tiny, fontWeight: '600' },
});
