import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Chip } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { useI18n } from '@/lib/i18n';
import { saveMeetPresence } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, radius, spacing } from '@/theme';

/**
 * マップ: a REAL map (OpenStreetMap tiles) centred on the user.
 *
 * Flow: ask for location permission → centre on the actual position and place
 * the demo dogs around the user at their stated distances. If permission is
 * denied (or lookup fails), the user types a place which is geocoded via
 * OSM Nominatim (Japan-biased) and the map centres there instead.
 */

const TILE = 256;

type LatLon = { lat: number; lon: number };
type Mode = 'locating' | 'ready' | 'manual';

/** Slippy-map tile math (Web Mercator). */
const lon2tile = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const lat2tile = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};
const metersPerPixel = (lat: number, z: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** z;

/** Zoom per radius so the filter circle roughly fills the screen. */
const ZOOM_FOR_RADIUS: Record<number, number> = { 1: 14, 3: 13, 5: 12, 10: 11 };
const RADII = [1, 3, 5, 10];

/** Deterministic bearing for a dog pin (stable across renders). */
function bearingFor(id: string, index: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return ((h / 997) * Math.PI * 2 + index * 0.9) % (Math.PI * 2);
}

export default function MapScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const owner = useStore((s) => s.owner);
  const updateOwner = useStore((s) => s.updateOwner);
  const { tx } = useI18n();

  const [meetNote, setMeetNote] = useState(owner?.meetNote ?? '');
  const availableToMeet = owner?.availableToMeet ?? false;

  // Persist map presence locally + to Supabase (best-effort, isolated write).
  const savePresence = (patch: { availableToMeet?: boolean; meetNote?: string }) => {
    if (!owner) return;
    const next = { ...owner, ...patch };
    updateOwner(patch);
    void saveMeetPresence(next.availableToMeet ?? false, next.meetNote ?? null);
  };

  const [mode, setMode] = useState<Mode>('locating');
  const [center, setCenter] = useState<LatLon | null>(null);
  const [placeName, setPlaceName] = useState<string>('現在地');
  const [radiusKm, setRadiusKm] = useState(5);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>();
  const [mapH, setMapH] = useState(600);

  // Ask for the real location once on mount; fall back to manual entry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('denied');
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
        ]);
        if (cancelled) return;
        setCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPlaceName('現在地');
        setMode('ready');
      } catch {
        if (!cancelled) setMode('manual');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Manual place search (OSM Nominatim, Japan-biased) — the entered location
  // is genuinely geocoded and the map centres on the result.
  const searchPlace = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(undefined);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ja&countrycodes=jp&q=${encodeURIComponent(q)}`,
      );
      const json = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      const hit = json[0];
      if (!hit) {
        setSearchError(
          tx(
            '場所が見つかりませんでした。別の地名で試してください。',
            'No results for that place. Try a different name.',
          ),
        );
        return;
      }
      setCenter({ lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) });
      setPlaceName(hit.display_name.split(',')[0].trim() || q);
      setMode('ready');
    } catch {
      setSearchError(
        tx('検索に失敗しました。通信環境を確認してください。', 'Search failed. Check your connection and try again.'),
      );
    } finally {
      setSearching(false);
    }
  };

  const zoom = ZOOM_FOR_RADIUS[radiusKm] ?? 12;

  // Tile mosaic around the centre. Recomputed on centre/zoom/layout change.
  const tiles = useMemo(() => {
    if (!center) return [];
    const cx = lon2tile(center.lon, zoom);
    const cy = lat2tile(center.lat, zoom);
    const halfW = width / 2;
    const halfH = mapH / 2;
    const span = (px: number) => Math.ceil(px / TILE) + 1;
    const out: { key: string; uri: string; left: number; top: number }[] = [];
    const max = 2 ** zoom;
    for (let dx = -span(halfW); dx <= span(halfW); dx++) {
      for (let dy = -span(halfH); dy <= span(halfH); dy++) {
        const tx = Math.floor(cx) + dx;
        const ty = Math.floor(cy) + dy;
        if (ty < 0 || ty >= max) continue;
        const wrappedX = ((tx % max) + max) % max;
        out.push({
          key: `${zoom}/${tx}/${ty}`,
          uri: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          left: halfW + (tx - cx) * TILE,
          top: halfH + (ty - cy) * TILE,
        });
      }
    }
    return out;
  }, [center, zoom, width, mapH]);

  // Demo dogs placed at their stated distance from the user, real geography.
  const pins = useMemo(() => {
    if (!center) return [];
    const mpp = metersPerPixel(center.lat, zoom);
    return SEED_DOGS.filter((d) => d.distanceKm <= radiusKm).map((dog) => {
      const idx = SEED_DOGS.indexOf(dog);
      const a = bearingFor(dog.id, idx);
      const px = (dog.distanceKm * 1000) / mpp;
      return {
        dog,
        x: width / 2 + px * Math.cos(a),
        y: mapH / 2 + px * Math.sin(a) * 0.9,
      };
    });
  }, [center, zoom, radiusKm, width, mapH]);

  const count = pins.length;

  return (
    <View style={styles.root}>
      {/* ------------------------------------------------------- Map layer */}
      <View style={styles.mapLayer} onLayout={(e) => setMapH(e.nativeEvent.layout.height)}>
        {center ? (
          <>
            {tiles.map((t) => (
              <Image
                key={t.key}
                source={{ uri: t.uri }}
                style={[styles.tile, { left: t.left, top: t.top }]}
                contentFit="cover"
                transition={150}
              />
            ))}
            {/* dark wash so the pink UI reads on light tiles */}
            <View style={styles.mapTint} pointerEvents="none" />

            {/* you */}
            <View style={[styles.youPin, { left: width / 2 - 14, top: mapH / 2 - 14 }]} pointerEvents="none">
              <View style={styles.youDot} />
            </View>

            {/* dogs */}
            {pins.map(({ dog, x, y }) => (
              <Pressable
                key={dog.id}
                onPress={() => router.push(`/dog/${dog.id}`)}
                accessibilityRole="button"
                accessibilityLabel={tx(
                  `${dog.name}のプロフィールを開く（${dog.distanceKm}km先）`,
                  `Open ${dog.name}’s profile (${dog.distanceKm}km away)`,
                )}
                style={[
                  styles.pin,
                  {
                    left: Math.min(Math.max(x - 27, 6), width - 60),
                    top: Math.min(Math.max(y - 27, 90), mapH - 140),
                  },
                ]}
              >
                <View style={styles.pinPhotoRing}>
                  <DogPhoto dog={dog} style={styles.pinPhoto} rounded={radius.pill} emojiSize={22} />
                </View>
                {dog.likesYou && (
                  <View style={styles.pinHeart}>
                    <Icon name="heartFill" color={night.pink} size={11} />
                  </View>
                )}
                <View style={styles.pinLabel}>
                  <Text style={styles.pinLabelText} numberOfLines={1}>
                    {tx(`${dog.name}・${dog.distanceKm}km`, `${dog.name} · ${dog.distanceKm}km`)}
                  </Text>
                </View>
              </Pressable>
            ))}

            <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
          </>
        ) : (
          <View style={styles.mapPlaceholder}>
            {mode === 'locating' && <ActivityIndicator color={night.pink} size="large" />}
          </View>
        )}
      </View>

      {/* --------------------------------------------------------- Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <Text style={styles.title}>{tx('マップ', 'Map')}</Text>

        {mode === 'locating' && (
          <View style={styles.card}>
            <ActivityIndicator color={night.pink} />
            <Text style={styles.cardText}>
              {tx(
                '位置情報を取得しています…（ブラウザの許可ダイアログをご確認ください）',
                'Getting your location… (check your browser’s permission prompt)',
              )}
            </Text>
          </View>
        )}

        {mode === 'manual' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{tx('場所を入力してください', 'Enter a location')}</Text>
            <Text style={styles.cardText}>
              {tx(
                '位置情報が利用できないため、地名や駅名から検索します（日本国内）。',
                'Location is unavailable, so search by place or station name (Japan only).',
              )}
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={tx('例：渋谷、横浜駅、札幌', 'e.g. Shibuya, Yokohama Station, Sapporo')}
                placeholderTextColor={night.faint}
                style={styles.searchInput}
                accessibilityLabel={tx('場所を検索', 'Search for a place')}
                onSubmitEditing={searchPlace}
                returnKeyType="search"
              />
              <Pressable
                onPress={searchPlace}
                disabled={searching}
                accessibilityRole="button"
                accessibilityLabel={tx('場所を検索する', 'Search for this place')}
                style={[styles.searchBtn, searching && { opacity: 0.6 }]}
              >
                <Text style={styles.searchBtnText}>
                  {searching ? tx('検索中…', 'Searching…') : tx('検索', 'Search')}
                </Text>
              </Pressable>
            </View>
            {!!searchError && <Text style={styles.searchError}>{searchError}</Text>}
          </View>
        )}

        {mode === 'ready' && center && (
          <>
            <View style={styles.cardRow}>
              <OwnerAvatar
                ownerId={owner?.id ?? 'me'}
                name={owner?.firstName ?? tx('あなた', 'You')}
                uri={owner?.photo}
                style={styles.cardAvatar}
                rounded={radius.pill}
                size={20}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {owner?.firstName ? tx(`${owner.firstName}さん`, owner.firstName) : tx('あなた', 'You')}
                </Text>
                <View style={styles.placeRow}>
                  <Icon name="pin" color={night.muted} size={12} />
                  <Text style={styles.placeText} numberOfLines={1}>
                    {placeName === '現在地' ? tx('現在地', 'Current location') : placeName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setMode('manual');
                  setSearchError(undefined);
                }}
                accessibilityRole="button"
                accessibilityLabel={tx('場所を変更', 'Change location')}
                style={styles.changeBtn}
              >
                <Text style={styles.changeBtnText}>{tx('場所を変更', 'Change location')}</Text>
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {RADII.map((r) => (
                <Chip key={r} label={`${r}km`} selected={radiusKm === r} onPress={() => setRadiusKm(r)} />
              ))}
            </View>
            <Text style={styles.countText}>
              {tx(
                `${radiusKm}km以内に${count}人`,
                `${count} ${count === 1 ? 'person' : 'people'} within ${radiusKm}km`,
              )}
            </Text>

            {/* Opt-in presence: show me on the map when I'm free to meet */}
            <View style={styles.presenceCard}>
              <View style={styles.presenceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.presenceTitle}>
                    {tx('マップに表示する', 'Show me on the map')}
                  </Text>
                  <Text style={styles.presenceSub}>
                    {tx('会えるときだけ表示されます', 'Only shown while you’re free to meet')}
                  </Text>
                </View>
                <Switch
                  value={availableToMeet}
                  onValueChange={(v) => savePresence({ availableToMeet: v })}
                  trackColor={{ false: night.surfaceHi, true: night.pink }}
                  thumbColor="#fff"
                  accessibilityLabel={tx('マップに表示する', 'Show me on the map')}
                />
              </View>

              {availableToMeet && (
                <TextInput
                  value={meetNote}
                  onChangeText={(t) => setMeetNote(t.slice(0, 60))}
                  onEndEditing={() => savePresence({ meetNote })}
                  onBlur={() => savePresence({ meetNote })}
                  placeholder={tx(
                    'いつ会える？ 例：週末の朝、今日の夕方以降',
                    'When are you free? e.g. weekend mornings, today after 5pm',
                  )}
                  placeholderTextColor={night.faint}
                  style={styles.presenceInput}
                  maxLength={60}
                  accessibilityLabel={tx('会えるタイミング', 'Your availability')}
                />
              )}

              <View style={styles.safetyRow}>
                <Icon name="pin" color={night.faint} size={12} />
                <Text style={styles.safetyText}>
                  {tx(
                    '正確な住所は表示されません。おおよその位置のみ表示されます。',
                    'Your exact address is never shown — only an approximate area.',
                  )}
                </Text>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.navy },

  mapLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  tile: { position: 'absolute', width: TILE, height: TILE, backgroundColor: night.navy },
  mapTint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(22,4,9,0.34)' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  youPin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(247,46,99,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: night.pink,
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  pin: { position: 'absolute', alignItems: 'center', width: 54 },
  pinPhotoRing: {
    padding: 2,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
  },
  pinPhoto: { width: 44, height: 44 },
  pinHeart: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinLabel: {
    marginTop: 3,
    backgroundColor: 'rgba(22,4,9,0.8)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: 96,
  },
  pinLabelText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  attribution: {
    position: 'absolute',
    left: spacing.sm,
    bottom: 96,
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
  },

  overlay: { flex: 1, paddingHorizontal: spacing.lg },
  title: { fontSize: font.title, fontWeight: '900', color: night.text, marginTop: spacing.sm },

  card: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(22,4,9,0.88)',
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardRow: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(22,4,9,0.88)',
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: 20,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: { color: night.text, fontSize: font.body, fontWeight: '800' },
  cardText: { color: night.muted, fontSize: font.small, lineHeight: 19 },
  cardAvatar: { width: 40, height: 40 },
  cardName: { color: night.text, fontSize: font.body, fontWeight: '800' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  placeText: { color: night.muted, fontSize: font.tiny, fontWeight: '600', flexShrink: 1 },
  changeBtn: {
    borderWidth: 1,
    borderColor: night.border,
    backgroundColor: night.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  changeBtnText: { color: night.text, fontSize: font.tiny, fontWeight: '700' },

  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchInput: {
    flex: 1,
    backgroundColor: night.input,
    borderWidth: 1.5,
    borderColor: night.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: night.text,
  },
  searchBtn: {
    backgroundColor: night.pink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: font.small },
  searchError: { color: night.danger, fontSize: font.tiny, fontWeight: '600' },

  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  countText: { color: night.text, fontSize: font.small, fontWeight: '700', marginTop: spacing.sm },

  presenceCard: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(22,4,9,0.9)',
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
  },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  presenceTitle: { color: night.text, fontSize: font.body, fontWeight: '800' },
  presenceSub: { color: night.muted, fontSize: font.tiny, fontWeight: '600', marginTop: 1 },
  presenceInput: {
    backgroundColor: night.input,
    borderWidth: 1.5,
    borderColor: night.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.small,
    color: night.text,
  },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  safetyText: { color: night.faint, fontSize: font.tiny, fontWeight: '600', flex: 1, lineHeight: 15 },
});
