import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon, IconName } from '@/components/icons';
import { SEED_DOGS } from '@/data/seed';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

export default function Call() {
  const router = useRouter();
  const { tx } = useI18n();
  const { dogId, mode } = useLocalSearchParams<{ dogId: string; mode?: string }>();
  const isVideo = mode === 'video';

  const dog = SEED_DOGS.find((d) => d.id === dogId);
  const owner = useStore((s) => s.owner);

  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    const c = setTimeout(() => setConnected(true), 1600);
    return () => clearTimeout(c);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  if (!dog) {
    return (
      <LinearGradient colors={[night.bgTop, night.bg]} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Text style={styles.name}>{tx('通話を利用できません', 'Call unavailable')}</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={tx('閉じる', 'Close')}
            style={styles.ctrl}
          >
            <Icon name="x" color="#fff" size={24} />
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <LinearGradient colors={[night.bgTop, night.bg]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {tx(
              `デモ通話 — 実際には接続されていません。ライブ${isVideo ? 'ビデオ' : '音声'}通話にはバックエンド（WebRTC）が必要です。`,
              `Demo call — nothing is actually connected. Live ${isVideo ? 'video' : 'voice'} calls need a backend (WebRTC).`,
            )}
          </Text>
        </View>

        <View style={styles.center}>
          <View style={styles.avatarRing}>
            <DogPhoto dog={dog} style={styles.bigAvatar} rounded={radius.xl} emojiSize={96} />
          </View>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.owner}>{tx(`${dog.ownerName}さんと`, `with ${dog.ownerName}`)}</Text>
          <Text style={styles.status}>
            {connected
              ? mmss
              : isVideo
                ? tx('ビデオ通話を発信中…', 'Starting video call…')
                : tx('音声通話を発信中…', 'Calling…')}
          </Text>
        </View>

        {isVideo && (
          <View style={styles.selfTile}>
            {videoOff ? (
              <View style={styles.selfOff}>
                <Text style={styles.selfOffText}>{tx('カメラオフ', 'Camera off')}</Text>
              </View>
            ) : (
              <>
                <PersonAvatar
                  name={owner?.firstName ?? tx('あなた', 'You')}
                  style={styles.selfAvatar}
                  rounded={radius.md}
                  size={40}
                />
                <Text style={styles.selfLabel}>{tx('あなた', 'You')}</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.controls}>
          <CallButton
            label={muted ? tx('ミュート解除', 'Unmute') : tx('ミュート', 'Mute')}
            icon="chat"
            active={muted}
            onPress={() => setMuted((m) => !m)}
          />
          {isVideo && (
            <CallButton
              label={videoOff ? tx('カメラをオン', 'Camera on') : tx('カメラをオフ', 'Camera off')}
              icon="video"
              active={videoOff}
              onPress={() => setVideoOff((v) => !v)}
            />
          )}
          <CallButton
            label={tx('終了', 'End')}
            icon="phone"
            rotate
            danger
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function CallButton({
  label,
  icon,
  onPress,
  active,
  danger,
  rotate,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  rotate?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={styles.ctrlWrap}
    >
      <View style={[styles.ctrl, active && styles.ctrlActive, danger && styles.ctrlDanger]}>
        <Icon
          name={icon}
          color={active ? night.bg : '#fff'}
          size={26}
          style={rotate ? styles.rotated : undefined}
        />
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  banner: {
    margin: spacing.md,
    backgroundColor: night.surface,
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerText: { color: night.muted, fontSize: font.tiny, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  avatarRing: {
    padding: 4,
    borderWidth: 2,
    borderColor: night.pink,
    borderRadius: radius.xl + 8,
  },
  bigAvatar: { width: 160, height: 160 },
  name: { color: night.text, fontSize: font.display, fontWeight: '900', marginTop: spacing.md },
  owner: { color: night.muted, fontSize: font.body, fontWeight: '600' },
  status: { color: night.text, fontSize: font.heading, fontWeight: '700', marginTop: spacing.sm },

  selfTile: {
    position: 'absolute',
    top: 70,
    right: spacing.lg,
    width: 96,
    height: 128,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  selfAvatar: { width: 56, height: 56 },
  selfLabel: { color: night.text, fontSize: font.tiny, fontWeight: '700' },
  selfOff: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  selfOffText: { color: night.muted, fontSize: font.tiny, fontWeight: '600' },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  ctrlWrap: { alignItems: 'center', gap: spacing.xs },
  ctrl: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    borderWidth: 1,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlActive: { backgroundColor: '#fff', borderColor: '#fff' },
  ctrlDanger: { backgroundColor: night.danger, borderColor: night.danger },
  rotated: { transform: [{ rotate: '135deg' }] },
  ctrlLabel: { color: night.text, fontSize: font.tiny, fontWeight: '700' },
});
