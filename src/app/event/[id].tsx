import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle, Tag } from '@/components/ui';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme';

// A few seed owners shown as illustrative attendees.
const SAMPLE_ATTENDEES = ['owner-2', 'owner-5', 'owner-9', 'owner-13', 'owner-6'];

export default function EventDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const events = useStore((s) => s.events);
  const rsvps = useStore((s) => s.rsvps);
  const rsvp = useStore((s) => s.rsvp);

  const event = (events ?? []).find((e) => e.id === id);

  if (!event) {
    return (
      <Screen title="Event" onBack={() => router.back()}>
        <Text style={styles.missing}>This event is no longer available.</Text>
      </Screen>
    );
  }

  const going = !!rsvps[event.id];
  const count = event.attendeeCount + (going ? 1 : 0);
  const isHost = event.hostOwnerId === 'owner-1';
  const attendeeAvatars = [event.hostOwnerId, ...SAMPLE_ATTENDEES.filter((o) => o !== event.hostOwnerId)].slice(0, 5);

  return (
    <Screen title="Event" onBack={() => router.back()}>
      <Tag label={event.type} tone="blue" />
      <Text style={styles.title}>{event.title}</Text>

      <Card style={{ gap: spacing.sm }}>
        <Row icon="🗓️" text={`${event.dateLabel} · ${event.timeLabel}`} />
        <Row icon="📍" text={`${event.locationName} · ${event.area}`} />
        <Row icon="🐾" text={`${count} going`} />
      </Card>

      {!!event.description && (
        <Card style={{ gap: spacing.xs }}>
          <SectionTitle>About</SectionTitle>
          <Text style={styles.body}>{event.description}</Text>
        </Card>
      )}

      <Card style={{ gap: spacing.md }}>
        <SectionTitle>Host</SectionTitle>
        <View style={styles.hostRow}>
          <OwnerAvatar ownerId={event.hostOwnerId} name={event.hostName} style={styles.hostAvatar} rounded={radius.pill} size={24} />
          <Text style={styles.hostName}>{isHost ? 'You' : event.hostName}</Text>
        </View>
      </Card>

      <SectionTitle>Going</SectionTitle>
      <View style={styles.attendees}>
        {attendeeAvatars.map((ownerId) => (
          <OwnerAvatar key={ownerId} ownerId={ownerId} name={ownerId} style={styles.attendeeAvatar} rounded={radius.pill} size={20} />
        ))}
        {count > attendeeAvatars.length && (
          <View style={styles.moreCount}>
            <Text style={styles.moreText}>+{count - attendeeAvatars.length}</Text>
          </View>
        )}
      </View>

      <Button
        label={going ? "You're going ✓ · Tap to leave" : 'Join this event'}
        variant={going ? 'outline' : 'primary'}
        onPress={() => rsvp(event.id, !going)}
      />

      <Text style={styles.safety}>
        Always meet in public, dog-friendly places and supervise your dog. A meetup is never
        guaranteed safe — use your judgement.
      </Text>
    </Screen>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { textAlign: 'center', marginTop: spacing.xxl, color: colors.muted },
  title: { fontSize: font.display, fontWeight: '900', color: colors.charcoal },
  body: { fontSize: font.body, color: colors.charcoal, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowIcon: { fontSize: 16 },
  rowText: { fontSize: font.body, color: colors.charcoal, fontWeight: '600' },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostAvatar: { width: 40, height: 40 },
  hostName: { fontSize: font.heading, fontWeight: '700', color: colors.charcoal },
  attendees: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  attendeeAvatar: { width: 40, height: 40 },
  moreCount: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontSize: font.small, fontWeight: '800', color: colors.muted },
  safety: { fontSize: font.tiny, color: colors.faint, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
});
