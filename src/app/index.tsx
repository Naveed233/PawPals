import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store';
import { colors, font, spacing } from '@/theme';

/**
 * Entry point. Acts as splash + router: waits for persisted state to hydrate,
 * then sends the user to the right place based on how far they've onboarded.
 */
export default function Index() {
  const hydrated = useStore((s) => s._hasHydrated);
  const session = useStore((s) => s.session);
  const owner = useStore((s) => s.owner);
  const dogCount = useStore((s) => s.dogs.length);

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>🐾</Text>
        <Text style={styles.brand}>PawPair</Text>
        <Text style={styles.tag}>Playdates for dogs</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  if (!session) return <Redirect href="/welcome" />;
  if (!owner) return <Redirect href="/onboarding/owner" />;
  if (dogCount === 0) return <Redirect href="/onboarding/dog" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: 72 },
  brand: { fontSize: 40, fontWeight: '900', color: '#fff', marginTop: spacing.sm },
  tag: { fontSize: font.body, color: '#fff', opacity: 0.85, fontWeight: '600' },
});
