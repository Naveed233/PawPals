import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { Icon, IconName } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle, Tag } from '@/components/ui';
import { JP_MEETUP, jp } from '@/lib/jp';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

// A few seed owners shown as illustrative attendees.
const SAMPLE_ATTENDEES = ['owner-2', 'owner-5', 'owner-9', 'owner-13', 'owner-6'];

/** Stored labels are English-formatted ("Sat 4 Jul" / "9:30 AM") — render in JP. */
const JP_DOW: Record<string, string> = { Mon: '月', Tue: '火', Wed: '水', Thu: '木', Fri: '金', Sat: '土', Sun: '日' };
const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function jpDateLabel(label: string): string {
  const m = label.trim().match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\s+([A-Za-z]{3})$/);
  if (!m || !MONTH_NUM[m[3]]) return label;
  return `${MONTH_NUM[m[3]]}月${Number(m[2])}日（${JP_DOW[m[1]]}）`;
}

function jpTimeLabel(label: string): string {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return label;
  return `${m[3].toUpperCase() === 'AM' ? '午前' : '午後'}${Number(m[1])}:${m[2]}`;
}

export default function EventDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const events = useStore((s) => s.events);
  const rsvps = useStore((s) => s.rsvps);
  const rsvp = useStore((s) => s.rsvp);

  const event = (events ?? []).find((e) => e.id === id);

  if (!event) {
    return (
      <Screen title="イベント" onBack={() => router.back()}>
        <Text style={styles.missing}>このイベントは表示できません。</Text>
      </Screen>
    );
  }

  const going = !!rsvps[event.id];
  const count = event.attendeeCount + (going ? 1 : 0);
  const isHost = event.hostOwnerId === 'owner-1';
  const attendeeAvatars = [event.hostOwnerId, ...SAMPLE_ATTENDEES.filter((o) => o !== event.hostOwnerId)].slice(0, 5);

  return (
    <Screen title="イベント" onBack={() => router.back()}>
      <View style={styles.tagRow}>
        <Tag label={jp(JP_MEETUP, event.type)} />
      </View>
      <Text style={styles.title}>{event.title}</Text>

      <Card style={{ gap: spacing.md }}>
        <Row icon="calendar" text={`${jpDateLabel(event.dateLabel)} · ${jpTimeLabel(event.timeLabel)}`} />
        <Row icon="pin" text={`${event.locationName}・${event.area}`} />
        <Row icon="pawFill" text={`${count}人参加予定`} />
      </Card>

      {!!event.description && (
        <Card style={{ gap: spacing.xs }}>
          <SectionTitle>イベントについて</SectionTitle>
          <Text style={styles.body}>{event.description}</Text>
        </Card>
      )}

      <Card style={{ gap: spacing.md }}>
        <SectionTitle>主催者</SectionTitle>
        <View style={styles.hostRow}>
          <OwnerAvatar ownerId={event.hostOwnerId} name={event.hostName} style={styles.hostAvatar} rounded={radius.pill} size={24} />
          <Text style={styles.hostName}>{isHost ? 'あなた' : `${event.hostName}さん`}</Text>
          {isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>主催</Text>
            </View>
          )}
        </View>
      </Card>

      <SectionTitle>参加メンバー</SectionTitle>
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
        label={going ? '参加中 ✓ ・タップで取り消し' : 'このイベントに参加する'}
        variant={going ? 'outline' : 'primary'}
        onPress={() => rsvp(event.id, !going)}
      />

      <Text style={styles.safety}>
        必ず犬同伴OKの公共の場所で会い、愛犬から目を離さないでください。ミートアップの安全は保証されません — ご自身で判断を。
      </Text>
    </Screen>
  );
}

function Row({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} color={night.pink} size={18} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { textAlign: 'center', marginTop: spacing.xxl, color: night.muted },
  tagRow: { flexDirection: 'row' },
  title: { fontSize: font.display, fontWeight: '900', color: night.text },
  body: { fontSize: font.body, color: night.text, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { fontSize: font.body, color: night.text, fontWeight: '600', flex: 1 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostAvatar: { width: 40, height: 40 },
  hostName: { fontSize: font.heading, fontWeight: '700', color: night.text },
  hostBadge: {
    backgroundColor: night.pinkSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  hostBadgeText: { fontSize: font.tiny, fontWeight: '800', color: '#FF8FAF' },
  attendees: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  attendeeAvatar: { width: 40, height: 40 },
  moreCount: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontSize: font.small, fontWeight: '800', color: night.muted },
  safety: { fontSize: font.tiny, color: night.faint, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
});
