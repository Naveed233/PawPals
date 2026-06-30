import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
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

import { Entrance } from '@/components/anim';
import { DogPhoto } from '@/components/DogPhoto';
import { Chip } from '@/components/ui';
import { replyFor, SUGGESTED_OPENERS } from '@/data/chat';
import { SEED_DOGS } from '@/data/seed';
import { pickPhoto } from '@/lib/media';
import { useStore } from '@/store';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function Chat() {
  const router = useRouter();
  const { dogId } = useLocalSearchParams<{ dogId: string }>();
  const dog = SEED_DOGS.find((d) => d.id === dogId);

  const conversations = useStore((s) => s.conversations);
  const sendText = useStore((s) => s.sendText);
  const sendImageMessage = useStore((s) => s.sendImageMessage);
  const receiveReply = useStore((s) => s.receiveReply);

  const messages = (dogId && conversations[dogId]) || [];
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (!dog) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>This conversation is unavailable.</Text>
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
    sendText(dog.id, trimmed);
    setInput('');
    scheduleReply(messages.length + 1);
  };

  const attachImage = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    sendImageMessage(dog.id, uri);
    scheduleReply(messages.length + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <DogPhoto dog={dog} style={styles.avatar} rounded={radius.pill} emojiSize={22} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {dog.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            with {dog.ownerName} · {dog.ownerArea}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(`/call/${dog.id}?mode=voice`)}
          hitSlop={10}
          accessibilityLabel="Voice call"
          style={styles.callBtn}
        >
          <Text style={styles.callIcon}>📞</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/call/${dog.id}?mode=video`)}
          hitSlop={10}
          accessibilityLabel="Video call"
          style={styles.callBtn}
        >
          <Text style={styles.callIcon}>🎥</Text>
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
            <Text style={styles.dayNoteText}>You matched with {dog.name} 🎉 Say hello!</Text>
          </View>

          {messages.length === 0 && (
            <View style={styles.openers}>
              <Text style={styles.openersTitle}>Suggested openers</Text>
              {SUGGESTED_OPENERS.map((o) => (
                <Chip key={o} label={o} onPress={() => send(o)} />
              ))}
            </View>
          )}

          {messages.map((m) => {
            const mine = m.sender === 'me';
            return (
              <Entrance key={m.id} distance={8}>
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    {m.kind === 'image' && m.uri ? (
                      <Image source={{ uri: m.uri }} style={styles.bubbleImage} contentFit="cover" />
                    ) : (
                      <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>
                        {m.text}
                      </Text>
                    )}
                  </View>
                </View>
              </Entrance>
            );
          })}

          {typing && (
            <View style={[styles.bubbleRow, styles.rowTheirs]}>
              <View style={[styles.bubble, styles.bubbleTheirs]}>
                <Text style={styles.typing}>{dog.name}'s owner is typing…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <Pressable onPress={attachImage} style={styles.attach} accessibilityLabel="Send a photo">
            <Text style={styles.attachIcon}>📷</Text>
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={colors.faint}
            style={styles.input}
            multiline
            onSubmitEditing={() => send(input)}
            accessibilityLabel="Message input"
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim()}
            style={[styles.sendBtn, !input.trim() && styles.sendDisabled]}
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  missing: { textAlign: 'center', marginTop: spacing.xxl, color: colors.muted },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: { fontSize: 34, color: colors.forest, lineHeight: 34, fontWeight: '300', paddingHorizontal: 4 },
  avatar: { width: 40, height: 40 },
  name: { fontSize: font.heading, fontWeight: '800', color: colors.charcoal },
  sub: { fontSize: font.tiny, color: colors.faint, fontWeight: '600' },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: { fontSize: 18 },

  messages: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  dayNote: { alignItems: 'center', marginBottom: spacing.sm },
  dayNoteText: {
    fontSize: font.tiny,
    color: colors.muted,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  openers: { gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-start' },
  openersTitle: { fontSize: font.small, fontWeight: '800', color: colors.faint, textTransform: 'uppercase' },

  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...shadow.soft },
  bubbleMine: { backgroundColor: colors.forest, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: font.body, lineHeight: 21 },
  textMine: { color: '#fff' },
  textTheirs: { color: colors.charcoal },
  bubbleImage: { width: 200, height: 240, borderRadius: radius.md },
  typing: { fontSize: font.small, color: colors.muted, fontStyle: 'italic' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  attach: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: { fontSize: 20 },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: font.body,
    color: colors.charcoal,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendIcon: { color: '#fff', fontSize: 22, fontWeight: '900' },
});
