import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Entrance } from '@/components/anim';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Button, Chip } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { type Lang, txFor, useI18n } from '@/lib/i18n';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';
import type { Message } from '@/types';

/** 時刻ラベル: 今日 → 14:05 / 昨日 / それ以前 → 7/12 */
function timeLabel(at: number, lang: Lang): string {
  const t = txFor(lang);
  const d = new Date(at);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t('昨日', 'Yesterday');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 未読数 = 末尾に連続する「相手から」のメッセージ数。 */
function unreadCount(messages: Message[]): number {
  let n = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === 'them') n++;
    else break;
  }
  return n;
}

export default function Matches() {
  const router = useRouter();
  const { lang, tx } = useI18n();
  const matches = useStore((s) => s.matches);
  const conversations = useStore((s) => s.conversations);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const rows = matches
    .map((m) => {
      const dog = SEED_DOGS.find((d) => d.id === m.dogId);
      if (!dog) return null;
      const convo = conversations[dog.id] ?? [];
      const last = convo.length > 0 ? convo[convo.length - 1] : undefined;
      return { match: m, dog, last, unread: unreadCount(convo) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // 未読 = 最後のメッセージが相手から届いているチャット
  const visible = filter === 'unread' ? rows.filter((r) => r.last?.sender === 'them') : rows;

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Text style={styles.pageTitle}>{tx('メッセージ', 'Messages')}</Text>
        <Text style={styles.pageSub}>
          {tx(
            `${matches.length}件のマッチ`,
            `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`,
          )}
        </Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="chat" color={night.pink} size={32} />
          </View>
          <Text style={styles.emptyTitle}>{tx('まだマッチがありません', 'No matches yet')}</Text>
          <Text style={styles.emptyBody}>
            {tx(
              'おたがいに「いいね」するとここに表示され、チャットやミートアップの相談ができます。',
              'When you like each other, they show up here so you can chat and plan a meetup.',
            )}
          </Text>
          <Button
            label={tx('相手を探す', 'Find matches')}
            onPress={() => router.push('/(tabs)')}
            style={styles.emptyCta}
          />
        </View>
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.sectionLabel}>{tx('ステータス', 'STATUS')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statusScroll}
              contentContainerStyle={styles.statusRow}
            >
              <Pressable
                onPress={() => router.push('/(tabs)')}
                accessibilityRole="button"
                accessibilityLabel={tx('相手を探す', 'Find matches')}
                style={({ pressed }) => [styles.statusItem, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.plusRing}>
                  <Icon name="plus" color={night.pink} size={26} />
                </View>
                <Text style={styles.statusName} numberOfLines={1}>
                  {tx('相手を探す', 'Find matches')}
                </Text>
              </Pressable>

              {rows.map(({ match, dog }) => (
                <Pressable
                  key={match.id}
                  onPress={() => router.push(`/chat/${dog.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={tx(`${dog.name}とチャット`, `Chat with ${dog.name}`)}
                  style={({ pressed }) => [styles.statusItem, pressed && { opacity: 0.8 }]}
                >
                  <View style={styles.photoRing}>
                    <DogPhoto dog={dog} style={styles.statusPhoto} rounded={radius.pill} emojiSize={28} />
                  </View>
                  <Text style={styles.statusName} numberOfLines={1}>
                    {dog.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filters}>
            <Chip
              label={tx('すべて', 'All')}
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label={tx('未読', 'Unread')}
              selected={filter === 'unread'}
              onPress={() => setFilter('unread')}
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={styles.sectionLabel}>{tx('チャット', 'CHATS')}</Text>

            {visible.length === 0 ? (
              <Text style={styles.noneText}>
                {filter === 'unread'
                  ? tx('未読のメッセージはありません。', 'No unread messages.')
                  : tx('チャットはまだありません。', 'No chats yet.')}
              </Text>
            ) : (
              <View style={styles.chatList}>
                {visible.map(({ match, dog, last, unread }, i) => {
                  const preview = last
                    ? last.kind === 'image'
                      ? tx('📷 写真', '📷 Photo')
                      : last.text ?? ''
                    : null;
                  return (
                    <Entrance key={match.id} delay={i * 60}>
                      <Pressable
                        onPress={() => router.push(`/chat/${dog.id}`)}
                        accessibilityRole="button"
                        accessibilityLabel={tx(
                          `${dog.name}のチャットを開く`,
                          `Open chat with ${dog.name}`,
                        )}
                        style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                      >
                        <DogPhoto dog={dog} style={styles.thumb} rounded={radius.pill} emojiSize={26} />
                        <View style={styles.rowBody}>
                          <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>
                              {dog.name}
                            </Text>
                            <Text style={styles.owner} numberOfLines={1}>
                              {tx(`${dog.ownerName}さん`, dog.ownerName)}
                            </Text>
                          </View>
                          {preview !== null ? (
                            <Text style={styles.preview} numberOfLines={1}>
                              {last?.sender === 'me' ? tx('自分: ', 'You: ') : ''}
                              {preview}
                            </Text>
                          ) : (
                            <Text style={styles.newMatch}>{tx('新しいマッチ！', 'New match!')}</Text>
                          )}
                        </View>
                        <View style={styles.rowRight}>
                          {!!last && <Text style={styles.time}>{timeLabel(last.at, lang)}</Text>}
                          {unread > 0 ? (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{unread}</Text>
                            </View>
                          ) : (
                            <Icon name="chevronRight" color={night.faint} size={16} />
                          )}
                        </View>
                      </Pressable>
                    </Entrance>
                  );
                })}
              </View>
            )}
          </View>

          <Text style={styles.footnote}>
            {tx(
              'タップしてチャット・写真の共有・音声/ビデオ通話ができます。',
              'Tap to chat, share photos, or start a voice/video call.',
            )}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: font.display, fontWeight: '900', color: night.text },
  pageSub: { fontSize: font.small, color: night.muted, fontWeight: '600' },

  sectionLabel: {
    fontSize: font.small,
    fontWeight: '800',
    color: night.faint,
    letterSpacing: 0.6,
  },

  // Status strip bleeds to the screen edges (Screen body has lg padding).
  statusScroll: { marginHorizontal: -spacing.lg },
  statusRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  statusItem: { alignItems: 'center', gap: 6, width: 72 },
  plusRing: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: night.border,
    backgroundColor: night.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRing: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: night.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPhoto: { width: 56, height: 56 },
  statusName: { fontSize: font.tiny, color: night.muted, fontWeight: '700' },

  filters: { flexDirection: 'row', gap: spacing.sm },

  chatList: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: night.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: night.border,
    padding: spacing.md,
  },
  thumb: { width: 56, height: 56 },
  rowBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '800', color: night.text, flexShrink: 1 },
  owner: { fontSize: font.small, color: night.muted, fontWeight: '600', flexShrink: 1 },
  preview: { fontSize: font.small, color: night.muted },
  newMatch: { fontSize: font.small, color: night.pink, fontWeight: '700' },
  rowRight: { alignItems: 'flex-end', gap: 6, minWidth: 40 },
  time: { fontSize: font.tiny, color: night.faint, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    backgroundColor: night.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  noneText: {
    fontSize: font.small,
    color: night.faint,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: night.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: font.title, fontWeight: '800', color: night.text },
  emptyBody: {
    fontSize: font.body,
    color: night.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  emptyCta: { alignSelf: 'stretch', marginTop: spacing.md },

  footnote: { fontSize: font.tiny, color: night.faint, textAlign: 'center', marginTop: spacing.sm },
});
