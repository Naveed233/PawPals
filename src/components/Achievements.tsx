import { StyleSheet, Text, View } from 'react-native';

import { useAchievements, type Achievement } from '@/lib/achievements';
import { useI18n } from '@/lib/i18n';
import { font, night, radius, shadow, spacing } from '@/theme';

/**
 * Achievements grid — celebrates friendship & getting outside (Strava/Rover
 * style). Earned badges glow warm; locked ones are muted with a subtle 🔒.
 * A golden progress bar shows how many are unlocked.
 */
export function AchievementsSection() {
  const { lang, tx } = useI18n();
  const { all, count, total } = useAchievements();
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  // Earned first, then locked — celebrate progress.
  const ordered = [...all].sort((a, b) => Number(b.earned) - Number(a.earned));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>{tx('実績・バッジ', 'Achievements')}</Text>
        </View>
        <Text style={styles.count}>
          {tx(`${count}/${total} 獲得`, `${count} of ${total}`)}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.grid}>
        {ordered.map((a) => (
          <Badge key={a.id} a={a} lang={lang} />
        ))}
      </View>
    </View>
  );
}

function Badge({ a, lang }: { a: Achievement; lang: 'ja' | 'en' }) {
  const t = lang === 'ja' ? a.ja : a.en;
  return (
    <View style={styles.badge}>
      <View style={[styles.medal, a.earned ? styles.medalOn : styles.medalOff]}>
        <Text style={[styles.emoji, !a.earned && styles.emojiOff]}>{a.emoji}</Text>
        {!a.earned && (
          <View style={styles.lock}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
      </View>
      <Text style={[styles.badgeTitle, !a.earned && styles.badgeTitleOff]} numberOfLines={2}>
        {t.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: night.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: night.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.soft,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trophy: { fontSize: 18 },
  title: { fontSize: font.heading, fontWeight: '800', color: night.text },
  count: { fontSize: font.small, fontWeight: '800', color: night.forest },

  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: night.golden },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  badge: { width: '23%', alignItems: 'center', gap: 4 },
  medal: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalOn: {
    backgroundColor: night.goldenSoft,
    borderWidth: 2,
    borderColor: night.golden,
  },
  medalOff: {
    backgroundColor: night.surfaceHi,
    borderWidth: 2,
    borderColor: night.border,
  },
  emoji: { fontSize: 26 },
  emojiOff: { opacity: 0.35 },
  lock: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: night.card,
    borderRadius: radius.pill,
    paddingHorizontal: 1,
  },
  lockText: { fontSize: 12 },
  badgeTitle: { fontSize: font.tiny, fontWeight: '700', color: night.text, textAlign: 'center' },
  badgeTitleOff: { color: night.faint },
});
