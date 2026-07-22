import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { Entrance } from '@/components/anim';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Chip } from '@/components/ui';
import { replyFor, SUGGESTED_OPENERS } from '@/data/chat';
import { dogById } from '@/lib/dogs';
import { useI18n } from '@/lib/i18n';
import { pickPhoto } from '@/lib/media';
import { blockUser, fetchMessages, reportContent, sendMessage, subscribeMessages } from '@/lib/remote';
import { uploadPhoto } from '@/lib/storage';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';
import type { Message } from '@/types';

/**
 * 定型オープナーの日本語訳。保存データ（data/chat.ts）は英語のままなので、
 * 表示と送信時にここで翻訳する（未知の値はそのまま表示）。
 */
const JP_OPENERS: Record<string, string> = {
  'Would you like to meet for a short walk?': '短いお散歩でお会いしませんか？',
  'What kind of play does your dog enjoy?': 'ワンちゃんはどんな遊びが好きですか？',
  'Would your dog be comfortable meeting in a quiet area?': '静かな場所での顔合わせは大丈夫そうですか？',
  'Are you available this weekend?': '今週末のご都合はいかがですか？',
  'Would you prefer a walk before off-leash play?': 'まずはリード散歩から始めるのはいかがですか？',
};

const fmtTime = (at: number) => {
  const d = new Date(at);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Chat() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)/matches');
  const { lang, tx } = useI18n();
  const { dogId } = useLocalSearchParams<{ dogId: string }>();
  const dog = dogById(dogId);

  const conversations = useStore((s) => s.conversations);
  const sendText = useStore((s) => s.sendText);
  const sendImageMessage = useStore((s) => s.sendImageMessage);
  const receiveReply = useStore((s) => s.receiveReply);
  const owner = useStore((s) => s.owner);
  const match = useStore((s) => s.matches.find((m) => m.dogId === dogId));

  // Real matches (from the DB) chat over Supabase in realtime; demo/seed dogs
  // keep the simulated conversation.
  const realMatchId = match?.matchId;
  const [realMessages, setRealMessages] = useState<Message[]>([]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!realMatchId || !owner?.id) return;
    let active = true;
    void fetchMessages(realMatchId).then((m) => {
      if (active) setRealMessages(m);
    });
    const unsub = subscribeMessages(realMatchId, owner.id, (m) => {
      setRealMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });
    return () => {
      active = false;
      unsub();
    };
  }, [realMatchId, owner?.id]);

  const messages = realMatchId ? realMessages : (dogId && conversations[dogId]) || [];

  if (!dog) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>
          {tx('このチャットは利用できません。', 'This chat is unavailable.')}
        </Text>
      </SafeAreaView>
    );
  }

  const scheduleReply = (countAfterSend: number) => {
    setTyping(true);
    setTimeout(() => {
      receiveReply(dog.id, replyFor(countAfterSend));
      setTyping(false);
    }, 1300);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    if (realMatchId) {
      void sendMessage(realMatchId, trimmed); // realtime echoes it back
      return;
    }
    sendText(dog.id, trimmed);
    scheduleReply(messages.length + 1);
  };

  const attachImage = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    if (realMatchId) {
      const url = await uploadPhoto(uri);
      if (url) void sendMessage(realMatchId, '', url);
      return;
    }
    sendImageMessage(dog.id, uri);
    scheduleReply(messages.length + 1);
  };

  // Safety: an in-app sheet (never a browser dialog) to block or report.
  const safety = () => {
    setReported(false);
    setSafetyOpen(true);
  };
  const doBlockChat = async () => {
    if (!dog) return;
    setSafetyOpen(false);
    await Promise.all([
      blockUser(dog.ownerId),
      reportContent(dog.ownerId, dog.id, 'Blocked from chat'),
    ]);
    goBack();
  };
  const doReportChat = async () => {
    if (!dog) return;
    await reportContent(dog.ownerId, dog.id, 'Reported from chat');
    setReported(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header (glass) */}
      <View style={styles.header}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={tx('戻る', 'Back')}
          style={styles.backBtn}
        >
          <Icon name="arrowLeft" color={night.text} size={22} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/dog/${dog.id}`)}
          accessibilityRole="button"
          accessibilityLabel={tx(`${dog.name}のプロフィールを開く`, `Open ${dog.name}'s profile`)}
          style={({ pressed }) => [styles.identity, pressed && { opacity: 0.7 }]}
        >
          <DogPhoto dog={dog} style={styles.avatar} rounded={radius.pill} emojiSize={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {dog.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {tx(`${dog.ownerName}さん · ${dog.ownerArea}`, `${dog.ownerName} · ${dog.ownerArea}`)}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/call/${dog.id}?mode=voice`)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={tx('音声通話', 'Voice call')}
          style={styles.callBtn}
        >
          <Icon name="phone" color={night.text} size={18} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/call/${dog.id}?mode=video`)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={tx('ビデオ通話', 'Video call')}
          style={styles.callBtn}
        >
          <Icon name="video" color={night.text} size={18} />
        </Pressable>
        <Pressable
          onPress={safety}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={tx('通報・ブロック', 'Report or block')}
          style={styles.callBtn}
        >
          <Icon name="dots" color={night.text} size={18} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dayNote}>
            <Text style={styles.dayNoteText}>
              {tx(
                `${dog.name}とマッチしました 🎉 あいさつしてみましょう！`,
                `You matched with ${dog.name} 🎉 Say hello!`,
              )}
            </Text>
          </View>

          {messages.length === 0 && (
            <View style={styles.openers}>
              <Text style={styles.openersTitle}>
                {tx('おすすめの最初のメッセージ', 'SUGGESTED OPENERS')}
              </Text>
              {SUGGESTED_OPENERS.map((o) => {
                const label = lang === 'ja' ? JP_OPENERS[o] ?? o : o;
                return <Chip key={o} label={label} onPress={() => send(label)} />;
              })}
            </View>
          )}

          {messages.map((m) => {
            const mine = m.sender === 'me';
            return (
              <Entrance key={m.id} distance={8}>
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={[styles.msgCol, mine ? styles.colMine : styles.colTheirs]}>
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      {m.kind === 'image' && m.uri ? (
                        <Image source={{ uri: m.uri }} style={styles.bubbleImage} contentFit="cover" />
                      ) : (
                        <Text style={styles.bubbleText}>{m.text}</Text>
                      )}
                    </View>
                    <Text style={styles.msgTime}>{fmtTime(m.at)}</Text>
                  </View>
                </View>
              </Entrance>
            );
          })}

          {typing && (
            <View style={[styles.bubbleRow, styles.rowTheirs]}>
              <View style={[styles.bubble, styles.bubbleTheirs]}>
                <Text style={styles.typing}>
                  {tx(`${dog.name}の飼い主さんが入力中…`, `${dog.name}'s owner is typing…`)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar (dark glass) */}
        <View style={styles.inputBar}>
          <Pressable
            onPress={attachImage}
            style={styles.attach}
            accessibilityRole="button"
            accessibilityLabel={tx('写真を送る', 'Send a photo')}
          >
            <Icon name="camera" color={night.text} size={20} />
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tx('メッセージを入力…', 'Type a message…')}
            placeholderTextColor={night.faint}
            style={styles.input}
            multiline
            onSubmitEditing={() => send(input)}
            accessibilityLabel={tx('メッセージ入力', 'Message input')}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim()}
            style={[styles.sendBtn, !input.trim() && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel={tx('送信', 'Send')}
          >
            <Icon name="send" color="#fff" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={safetyOpen}
        title={reported ? tx('ありがとうございます', 'Thanks for the report') : tx('安全のために', 'Keep yourself safe')}
        message={
          reported
            ? tx('モデレーションチームが確認します。', 'Our moderation team will review it.')
            : dog
              ? tx(`${dog.ownerName}さんについて、どうしますか？`, `What would you like to do about ${dog.ownerName}?`)
              : undefined
        }
        actions={
          reported
            ? []
            : [
                {
                  key: 'report',
                  emoji: '🚩',
                  label: tx('通報する', 'Report this person'),
                  sublabel: tx('不適切な内容を運営に報告します', 'Flag inappropriate behaviour to our team'),
                  onPress: () => void doReportChat(),
                },
                {
                  key: 'block',
                  emoji: '🚫',
                  destructive: true,
                  label: tx('ブロックする', 'Block this person'),
                  sublabel: tx('今後やり取りできなくなります', 'You won’t be able to contact each other'),
                  onPress: () => void doBlockChat(),
                },
              ]
        }
        onClose={() => setSafetyOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: night.bg },
  flex: { flex: 1 },
  missing: { textAlign: 'center', marginTop: spacing.xxl, color: night.muted },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: night.border,
    backgroundColor: night.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderWidth: 2, borderColor: night.pink },
  name: { fontSize: font.heading, fontWeight: '800', color: night.text },
  sub: { fontSize: font.tiny, color: night.muted, fontWeight: '600' },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    borderWidth: 1,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messages: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  dayNote: { alignItems: 'center', marginBottom: spacing.sm },
  dayNoteText: {
    fontSize: font.tiny,
    color: night.muted,
    backgroundColor: night.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  openers: { gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-start' },
  openersTitle: {
    fontSize: font.small,
    fontWeight: '800',
    color: night.faint,
    letterSpacing: 0.6,
  },

  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  msgCol: { maxWidth: '78%', gap: 3 },
  colMine: { alignItems: 'flex-end' },
  colTheirs: { alignItems: 'flex-start' },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: { backgroundColor: night.pink, borderBottomRightRadius: 6 },
  bubbleTheirs: {
    backgroundColor: night.surface,
    borderWidth: 1,
    borderColor: night.border,
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontSize: font.body, lineHeight: 21, color: night.text },
  bubbleImage: { width: 200, height: 240, borderRadius: radius.md },
  msgTime: { fontSize: 10, color: night.faint, fontWeight: '600' },
  typing: { fontSize: font.small, color: night.muted, fontStyle: 'italic' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: night.border,
    backgroundColor: night.bg,
  },
  attach: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    borderWidth: 1,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: night.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: night.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: font.body,
    color: night.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: night.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
