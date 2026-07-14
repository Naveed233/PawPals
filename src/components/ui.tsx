import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, font, night, radius, shadow, spacing } from '@/theme';

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BUTTON_VARIANTS[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isDisabled && styles.btnPressed,
        isDisabled && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon}
          <Text style={[styles.btnText, { color: v.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: night.pink, fg: '#fff', border: night.pink },
  secondary: { bg: night.surfaceHi, fg: '#fff', border: 'transparent' },
  outline: { bg: 'transparent', fg: '#fff', border: 'rgba(255,255,255,0.35)' },
  ghost: { bg: 'transparent', fg: night.muted, border: 'transparent' },
  danger: { bg: night.danger, fg: '#fff', border: night.danger },
  dark: { bg: colors.ink, fg: '#fff', border: colors.ink },
};

/* ------------------------------------------------------------------ Chip */

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextOn : styles.chipTextOff]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------- Plain tag */

export function Tag({ label, tone = 'forest' }: { label: string; tone?: 'forest' | 'blue' | 'coral' }) {
  const map = {
    forest: { bg: night.pinkSoft, fg: '#FF8FAF' },
    blue: { bg: 'rgba(111,168,220,0.22)', fg: '#9CC4EA' },
    coral: { bg: 'rgba(242,118,94,0.22)', fg: '#FFAB97' },
  } as const;
  const t = map[tone];
  return (
    <View style={[styles.tag, { backgroundColor: t.bg }]}>
      <Text style={[styles.tagText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* ----------------------------------------------------------------- Field */

export function Field({
  label,
  error,
  containerStyle,
  ...inputProps
}: TextInputProps & { label: string; error?: string; containerStyle?: ViewStyle }) {
  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, !!error && styles.inputError]}
        accessibilityLabel={label}
        {...inputProps}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

/* --------------------------------------------------------- Misc helpers */

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function VerifiedBadge() {
  return (
    <View style={styles.verified}>
      <Text style={styles.verifiedText}>✓ 認証済み</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: font.body, fontWeight: '700' },

  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipOn: { backgroundColor: night.pink, borderColor: night.pink },
  chipOff: { backgroundColor: night.surface, borderColor: night.border },
  chipText: { fontSize: font.small, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  chipTextOff: { color: night.muted },

  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: font.small, fontWeight: '600' },

  fieldLabel: { fontSize: font.small, fontWeight: '700', color: night.text },
  input: {
    backgroundColor: night.input,
    borderWidth: 1.5,
    borderColor: night.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: night.text,
  },
  inputError: { borderColor: night.danger },
  fieldError: { fontSize: font.tiny, color: night.danger, fontWeight: '600' },

  sectionTitle: {
    fontSize: font.small,
    fontWeight: '800',
    color: night.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  card: {
    backgroundColor: night.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: night.border,
    ...shadow.soft,
  },

  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: night.pinkSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  verifiedText: { fontSize: font.tiny, fontWeight: '800', color: '#FF8FAF' },
});
