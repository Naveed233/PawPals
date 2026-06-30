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

import { colors, font, radius, shadow, spacing } from '@/theme';

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

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
  primary: { bg: colors.forest, fg: '#fff', border: colors.forest },
  secondary: { bg: colors.blue, fg: '#fff', border: colors.blue },
  outline: { bg: 'transparent', fg: colors.forest, border: colors.forest },
  ghost: { bg: 'transparent', fg: colors.muted, border: 'transparent' },
  danger: { bg: colors.coral, fg: '#fff', border: colors.coral },
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
    forest: { bg: colors.forestSoft, fg: colors.forestDark },
    blue: { bg: colors.blueSoft, fg: '#3D6A93' },
    coral: { bg: colors.coralSoft, fg: '#B6432F' },
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
      <Text style={styles.verifiedText}>✓ Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.lg,
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
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  chipText: { fontSize: font.small, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  chipTextOff: { color: colors.muted },

  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: font.small, fontWeight: '600' },

  fieldLabel: { fontSize: font.small, fontWeight: '700', color: colors.charcoal },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: colors.charcoal,
  },
  inputError: { borderColor: colors.danger },
  fieldError: { fontSize: font.tiny, color: colors.danger, fontWeight: '600' },

  sectionTitle: {
    fontSize: font.small,
    fontWeight: '800',
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },

  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forestSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  verifiedText: { fontSize: font.tiny, fontWeight: '800', color: colors.forestDark },
});
