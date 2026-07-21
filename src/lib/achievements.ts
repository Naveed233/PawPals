import { useStore } from '@/store';

/**
 * Achievements — Strava/Rover-style rewards that celebrate friendship and
 * getting outside, derived entirely from what the user actually does. No
 * separate storage: each badge is computed from live app state, so it can
 * never drift out of sync.
 */
export interface Achievement {
  id: string;
  emoji: string;
  ja: { title: string; desc: string };
  en: { title: string; desc: string };
  earned: boolean;
}

export function useAchievements(): {
  all: Achievement[];
  earned: Achievement[];
  count: number;
  total: number;
} {
  const owner = useStore((s) => s.owner);
  const dogs = useStore((s) => s.dogs);
  const matches = useStore((s) => s.matches);
  const swipes = useStore((s) => s.swipes);
  const saved = useStore((s) => s.saved);
  const events = useStore((s) => s.events);
  const rsvps = useStore((s) => s.rsvps);
  const conversations = useStore((s) => s.conversations);

  const hostedCount = (events ?? []).filter((e) => owner && e.hostOwnerId === owner.id).length;
  const joinedCount = Object.values(rsvps).filter(Boolean).length;
  const sentAnyMessage = Object.values(conversations).some((c) => c.some((m) => m.sender === 'me'));
  const maxPhotos = dogs.reduce((n, d) => Math.max(n, d.photos?.length ?? 0), 0);

  const all: Achievement[] = [
    {
      id: 'first-steps',
      emoji: '🐾',
      ja: { title: 'はじめの一歩', desc: 'ワンちゃんのプロフィールを作成' },
      en: { title: 'First Steps', desc: 'Created a dog profile' },
      earned: dogs.length > 0,
    },
    {
      id: 'verified',
      emoji: '✅',
      ja: { title: '本人確認済み', desc: 'アカウントを認証' },
      en: { title: 'Verified', desc: 'Verified your account' },
      earned: !!owner?.verified,
    },
    {
      id: 'first-friend',
      emoji: '🤝',
      ja: { title: 'はじめての友だち', desc: '最初のマッチ' },
      en: { title: 'First Friend', desc: 'Made your first match' },
      earned: matches.length >= 1,
    },
    {
      id: 'popular-pup',
      emoji: '🎉',
      ja: { title: '人気者', desc: '5組とマッチ' },
      en: { title: 'Popular Pup', desc: 'Matched with 5 friends' },
      earned: matches.length >= 5,
    },
    {
      id: 'explorer',
      emoji: '🗺️',
      ja: { title: '探検家', desc: '20頭のワンちゃんをチェック' },
      en: { title: 'Explorer', desc: 'Browsed 20 dogs' },
      earned: swipes.length >= 20,
    },
    {
      id: 'walk-buddy',
      emoji: '🚶',
      ja: { title: 'おさんぽ仲間', desc: 'ミートアップに参加' },
      en: { title: 'Walk Buddy', desc: 'Joined a meetup' },
      earned: joinedCount >= 1,
    },
    {
      id: 'regular',
      emoji: '🔥',
      ja: { title: '常連', desc: '3回ミートアップに参加' },
      en: { title: 'Regular', desc: 'Joined 3 meetups' },
      earned: joinedCount >= 3,
    },
    {
      id: 'host',
      emoji: '🌳',
      ja: { title: '主催者', desc: 'イベントを主催' },
      en: { title: 'Host', desc: 'Hosted an event' },
      earned: hostedCount >= 1,
    },
    {
      id: 'photogenic',
      emoji: '📸',
      ja: { title: 'フォトジェニック', desc: '写真を3枚以上追加' },
      en: { title: 'Photogenic', desc: 'Added 3+ photos' },
      earned: maxPhotos >= 3,
    },
    {
      id: 'chatterbox',
      emoji: '💬',
      ja: { title: 'おしゃべり', desc: 'メッセージを送信' },
      en: { title: 'Chatterbox', desc: 'Sent a message' },
      earned: sentAnyMessage,
    },
    {
      id: 'ready-to-roam',
      emoji: '☀️',
      ja: { title: 'いつでも会える', desc: 'マップに表示をオン' },
      en: { title: 'Ready to Roam', desc: 'Turned on map presence' },
      earned: !!owner?.availableToMeet,
    },
    {
      id: 'collector',
      emoji: '💛',
      ja: { title: 'コレクター', desc: '5頭をお気に入りに保存' },
      en: { title: 'Collector', desc: 'Saved 5 dogs' },
      earned: saved.length >= 5,
    },
  ];

  const earned = all.filter((a) => a.earned);
  return { all, earned, count: earned.length, total: all.length };
}
