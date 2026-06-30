import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Entrance } from '@/components/anim';
import { OwnerAvatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/ui';
import { useStore } from '@/store';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function Events() {
  const router = useRouter();
  const events = useStore((s) => s.events);
  const rsvps = useStore((s) => s.rsvps);
  const ensureEvents = useStore((s) => s.ensureEvents);
  const rsvp = useStore((s) => s.rsvp);

  useEffect(() => {
    ensureEvents();
  }, [ensureEvents]);

  const list = events ?? [];

  return (
    <Screen
      title="Events & meetups"
      subtitle={`${list.length} upcoming`}
      right={
        <Pressable onPress={() => router.push('/create-event')} accessibilityLabel="Host an event" hitSlop={10}>
          <Text style={styles.host}>＋</Text>
        </Pressable>
      }
    >
      {list.map((e, i) => {
        const going = !!rsvps[e.id];
        const count = e.attendeeCount + (going ? 1 : 0);
        return (
          <Entrance key={e.id} delay={i * 60}>
            <Pressable
              onPress={() => router.push(`/event/${e.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${e.title}`}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
            >
              <View style={styles.topRow}>
                <Tag label={e.type} tone="blue" />
                <Text style={styles.when}>
                  {e.dateLabel} · {e.timeLabel}
                </Text>
              </View>
              <Text style={styles.title}>{e.title}</Text>
              <Text style={styles.place}>📍 {e.locationName} · {e.area}</Text>

              <View style={styles.bottomRow}>
                <View style={styles.hostRow}>
                  <OwnerAvatar ownerId={e.hostOwnerId} name={e.hostName} style={styles.hostAvatar} rounded={radius.pill} size={18} />
                  <Text style={styles.hostText}>
                    {e.hostOwnerId === 'owner-1' ? 'You host' : `${e.hostName} hosts`} · {count} going
                  </Text>
                </View>
                <Pressable
                  onPress={() => rsvp(e.id, !going)}
                  accessibilityLabel={going ? `Leave ${e.title}` : `Join ${e.title}`}
                  style={[styles.rsvp, going ? styles.rsvpOn : styles.rsvpOff]}
                >
                  <Text style={[styles.rsvpText, going ? styles.rsvpTextOn : styles.rsvpTextOff]}>
                    {going ? 'Going ✓' : 'Join'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Entrance>
        );
      })}

      <Text style={styles.footnote}>
        Meet in public, dog-friendly places. You're responsible for supervising your dog at any meetup.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  host: { fontSize: 28, color: colors.forest, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.soft,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  when: { fontSize: font.small, color: colors.muted, fontWeight: '700' },
  title: { fontSize: font.heading, fontWeight: '800', color: colors.charcoal },
  place: { fontSize: font.small, color: colors.muted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  hostAvatar: { width: 26, height: 26 },
  hostText: { fontSize: font.small, color: colors.faint, fontWeight: '600' },
  rsvp: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1.5 },
  rsvpOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  rsvpOff: { backgroundColor: colors.surface, borderColor: colors.forest },
  rsvpText: { fontSize: font.small, fontWeight: '800' },
  rsvpTextOn: { color: '#fff' },
  rsvpTextOff: { color: colors.forest },
  footnote: { fontSize: font.tiny, color: colors.faint, textAlign: 'center', marginTop: spacing.sm, lineHeight: 16 },
});
