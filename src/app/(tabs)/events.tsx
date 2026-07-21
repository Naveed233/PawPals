import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Entrance } from '@/components/anim';
import { OwnerAvatar } from '@/components/Avatar';
import { Icon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Button, Tag } from '@/components/ui';
import { remindForEvent } from '@/lib/calendar';
import { eventStyle } from '@/lib/eventStyle';
import { type Lang, txFor, useI18n } from '@/lib/i18n';
import { JP_MEETUP } from '@/lib/jp';
import { useStore } from '@/store';
import { font, night, radius, shadow, spacing } from '@/theme';
import type { PawEvent } from '@/types';

/** Stored labels are English-formatted ("Sat 4 Jul" / "9:30 AM") — render in JP; pass through in EN. */
const JP_DOW: Record<string, string> = { Mon: '月', Tue: '火', Wed: '水', Thu: '木', Fri: '金', Sat: '土', Sun: '日' };
const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function dateLabelFor(lang: Lang, label: string): string {
  const m = label.trim().match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\s+([A-Za-z]{3})$/);
  if (!m || !MONTH_NUM[m[3]]) return label;
  return txFor(lang)(`${MONTH_NUM[m[3]]}月${Number(m[2])}日（${JP_DOW[m[1]]}）`, label);
}

function timeLabelFor(lang: Lang, label: string): string {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return label;
  return txFor(lang)(`${m[3].toUpperCase() === 'AM' ? '午前' : '午後'}${Number(m[1])}:${m[2]}`, label);
}

export default function Events() {
  const router = useRouter();
  const { lang, tx, tv } = useI18n();
  const events = useStore((s) => s.events);
  const rsvps = useStore((s) => s.rsvps);
  const me = useStore((s) => s.owner);
  const ensureEvents = useStore((s) => s.ensureEvents);
  const rsvp = useStore((s) => s.rsvp);

  useEffect(() => {
    ensureEvents();
  }, [ensureEvents]);

  const list = events ?? [];

  const toggleJoin = (e: PawEvent, going: boolean) => {
    rsvp(e.id, !going);
    if (!going) void remindForEvent(e, tx); // just joined → add phone reminder
  };

  return (
    <Screen
      title={tx('イベント・ミートアップ', 'Events & Meetups')}
      subtitle={tx(`${list.length}件の予定`, `${list.length} upcoming`)}
      right={
        <Pressable
          onPress={() => router.push('/create-event')}
          accessibilityRole="button"
          accessibilityLabel={tx('イベントを主催する', 'Host an event')}
          hitSlop={10}
          style={({ pressed }) => [styles.hostBtn, pressed && { opacity: 0.8 }]}
        >
          <Icon name="plus" color={night.text} size={18} />
        </Pressable>
      }
    >
      {list.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>
            {tx('まだイベントがありません', 'No meetups yet')}
          </Text>
          <Text style={styles.emptyBody}>
            {tx(
              '最初のミートアップを主催しませんか？公共の場所と日時を決めるだけ。参加した人にはスマホにリマインダーが届きます。',
              'Be the first to host a meetup. Pick a public spot and a time — everyone who joins gets a reminder on their phone.',
            )}
          </Text>
          <Button
            label={tx('イベントを主催する', 'Host an event')}
            onPress={() => router.push('/create-event')}
            style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
          />
        </View>
      )}

      {list.map((e, i) => {
        const going = !!rsvps[e.id];
        const count = e.attendeeCount + (going ? 1 : 0);
        return (
          <Entrance key={e.id} delay={i * 60}>
            {/* RSVP is a sibling of the open-card Pressable (not a child) —
                nested <button> elements are invalid HTML on web. */}
            <View style={styles.card}>
              <Pressable
                onPress={() => router.push(`/event/${e.id}`)}
                accessibilityRole="button"
                accessibilityLabel={tx(`${e.title}を開く`, `Open ${e.title}`)}
                style={({ pressed }) => [styles.cardBody, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.topRow}>
                  <Tag label={tv(JP_MEETUP, e.type)} tone={eventStyle(e.type).category} emoji={eventStyle(e.type).emoji} />
                  <Text style={styles.when}>
                    {dateLabelFor(lang, e.dateLabel)} · {timeLabelFor(lang, e.timeLabel)}
                  </Text>
                </View>
                <Text style={styles.title}>{e.title}</Text>
                <View style={styles.placeRow}>
                  <Icon name="pin" color={night.muted} size={14} />
                  <Text style={styles.place} numberOfLines={1}>
                    {tx(`${e.locationName}・${e.area}`, `${e.locationName} · ${e.area}`)}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.bottomRow}>
                <View style={styles.hostRow}>
                  <OwnerAvatar ownerId={e.hostOwnerId} name={e.hostName} style={styles.hostAvatar} rounded={radius.pill} size={18} />
                  <Text style={styles.hostText} numberOfLines={1}>
                    {me && e.hostOwnerId === me.id
                      ? tx(`あなたが主催・${count}人参加`, `Hosted by you · ${count} going`)
                      : tx(`${e.hostName}さんが主催・${count}人参加`, `Hosted by ${e.hostName} · ${count} going`)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleJoin(e, going)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    going
                      ? tx(`${e.title}の参加を取り消す`, `Cancel your RSVP for ${e.title}`)
                      : tx(`${e.title}に参加する`, `Join ${e.title}`)
                  }
                  style={[styles.rsvp, going ? styles.rsvpOn : styles.rsvpOff]}
                >
                  <Text style={[styles.rsvpText, going ? styles.rsvpTextOn : styles.rsvpTextOff]}>
                    {going ? tx('参加中 ✓', 'Going ✓') : tx('参加する', 'Join')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Entrance>
        );
      })}

      {list.length > 0 && (
        <Text style={styles.footnote}>
          {tx(
            '必ず犬同伴OKの公共の場所で会いましょう。ミートアップ中の愛犬の管理は飼い主の責任です。',
            'Always meet in public, dog-friendly places. You’re responsible for your dog during meetups.',
          )}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hostBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: night.surface,
    borderWidth: 1,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: night.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: night.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.soft,
  },
  cardBody: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  when: { fontSize: font.small, color: night.muted, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  title: { fontSize: font.heading, fontWeight: '800', color: night.text },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  place: { fontSize: font.small, color: night.muted, flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, gap: spacing.sm },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  hostAvatar: { width: 26, height: 26 },
  hostText: { fontSize: font.small, color: night.faint, fontWeight: '600', flex: 1 },
  rsvp: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1.5 },
  rsvpOn: { backgroundColor: night.pink, borderColor: night.pink },
  rsvpOff: { backgroundColor: 'transparent', borderColor: night.pink },
  rsvpText: { fontSize: font.small, fontWeight: '800' },
  rsvpTextOn: { color: '#fff' },
  rsvpTextOff: { color: night.pink },
  footnote: { fontSize: font.tiny, color: night.faint, textAlign: 'center', marginTop: spacing.sm, lineHeight: 16 },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: night.text, textAlign: 'center' },
  emptyBody: {
    fontSize: font.body,
    color: night.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
