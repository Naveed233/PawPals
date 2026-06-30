import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { SEED_DOGS } from '@/data/seed';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme';

export default function Call() {
  const router = useRouter();
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
      <LinearGradient colors={[colors.forest, colors.forestDark]} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Text style={styles.name}>Call unavailable</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>✕</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <LinearGradient colors={[colors.forest, colors.forestDark]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Demo call — not a real connection. Live {isVideo ? 'video' : 'voice'} needs a backend (WebRTC).
          </Text>
        </View>

        <View style={styles.center}>
          <DogPhoto dog={dog} style={styles.bigAvatar} rounded={radius.xl} emojiSize={96} />
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.owner}>with {dog.ownerName}</Text>
          <Text style={styles.status}>{connected ? mmss : `${isVideo ? 'Video' : 'Voice'} calling…`}</Text>
        </View>

        {isVideo && (
          <View style={styles.selfTile}>
            {videoOff ? (
              <View style={styles.selfOff}>
                <Text style={styles.selfOffText}>Camera off</Text>
              </View>
            ) : (
              <>
                <PersonAvatar name={owner?.firstName ?? 'You'} style={styles.selfAvatar} rounded={radius.md} size={40} />
                <Text style={styles.selfLabel}>You</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.controls}>
          <CallButton
            label={muted ? 'Unmute' : 'Mute'}
            icon={muted ? '🔇' : '🎙️'}
            active={muted}
            onPress={() => setMuted((m) => !m)}
          />
          {isVideo && (
            <CallButton
              label={videoOff ? 'Camera on' : 'Camera off'}
              icon={videoOff ? '📷' : '🎥'}
              active={videoOff}
              onPress={() => setVideoOff((v) => !v)}
            />
          )}
          <CallButton label="End" icon="📵" danger onPress={() => router.back()} />
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
}: {
  label: string;
  icon: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={styles.ctrlWrap}>
      <View
        style={[
          styles.ctrl,
          active && styles.ctrlActive,
          danger && styles.ctrlDanger,
        ]}
      >
        <Text style={styles.ctrlIcon}>{icon}</Text>
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  banner: {
    margin: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerText: { color: '#fff', fontSize: font.tiny, textAlign: 'center', opacity: 0.95 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  bigAvatar: { width: 160, height: 160 },
  name: { color: '#fff', fontSize: font.display, fontWeight: '900', marginTop: spacing.md },
  owner: { color: '#fff', fontSize: font.body, opacity: 0.85 },
  status: { color: '#fff', fontSize: font.heading, fontWeight: '700', marginTop: spacing.sm, opacity: 0.95 },

  selfTile: {
    position: 'absolute',
    top: 70,
    right: spacing.lg,
    width: 96,
    height: 128,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  selfAvatar: { width: 56, height: 56 },
  selfLabel: { color: '#fff', fontSize: font.tiny, fontWeight: '700' },
  selfOff: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  selfOffText: { color: '#fff', fontSize: font.tiny, opacity: 0.8 },

  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.lg },
  ctrlWrap: { alignItems: 'center', gap: spacing.xs },
  ctrl: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  ctrlDanger: { backgroundColor: colors.danger },
  ctrlIcon: { fontSize: 26 },
  ctrlLabel: { color: '#fff', fontSize: font.tiny, fontWeight: '700' },
});
