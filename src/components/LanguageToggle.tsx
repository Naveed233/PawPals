import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useStore } from '@/store';

/**
 * 日本語 / EN segmented pill. Dark-glass styling so it sits on both the auth
 * screens and the night-theme app screens.
 */
export function LanguageToggle({ style }: { style?: StyleProp<ViewStyle> }) {
  const lang = useStore((s) => s.language ?? 'ja');
  const setLanguage = useStore((s) => s.setLanguage);

  const seg = (value: 'ja' | 'en', label: string) => {
    const active = lang === value;
    return (
      <Pressable
        onPress={() => setLanguage(value)}
        accessibilityRole="button"
        accessibilityLabel={value === 'ja' ? '日本語に切り替え' : 'Switch to English'}
        accessibilityState={{ selected: active }}
        style={[styles.seg, active && styles.segOn]}
      >
        <Text style={[styles.segText, active && styles.segTextOn]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, style]}>
      {seg('ja', '日本語')}
      {seg('en', 'EN')}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  seg: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  segOn: { backgroundColor: 'rgba(255,255,255,0.92)' },
  segText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  segTextOn: { color: '#17170A' },
});
