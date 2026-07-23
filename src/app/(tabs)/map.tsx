import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OwnerAvatar } from '@/components/Avatar';
import { DogPhoto } from '@/components/DogPhoto';
import { Icon } from '@/components/icons';
import { Chip } from '@/components/ui';
import { SEED_DOGS } from '@/data/seed';
import { useI18n } from '@/lib/i18n';
import { useTabBarClearance } from '@/lib/layout';
import { TILE_ATTRIBUTION, tileUrl } from '@/lib/mapTiles';
import { saveMeetPresence } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, radius, shadow, spacing } from '@/theme';

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

/** Great-circle distance in km between two lat/lon points. */
const haversineKm = (aLat: number, aLon: number, bLat: number, bLon: number): number => {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

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

  const remoteDogs = useStore((s) => s.remoteDogs);

  const [mode, setMode] = useState<Mode>('locating');
  // `center` is the pannable map view; `homeLoc` is where the user actually is.
  const [center, setCenter] = useState<LatLon | null>(null);
  const [homeLoc, setHomeLoc] = useState<LatLon | null>(null);
  const [placeName, setPlaceName] = useState<string>('現在地');
  const [radiusKm, setRadiusKm] = useState(5);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>();
  const [mapH, setMapH] = useState(600);
  const [zoom, setZoom] = useState<number>(ZOOM_FOR_RADIUS[5] ?? 12);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const tabClearance = useTabBarClearance();

  const setLocation = (loc: LatLon, place: string) => {
    setHomeLoc(loc);
    setCenter(loc);
    setPlaceName(place);
    setMode('ready');
  };

  const MIN_ZOOM = 4; // zoom out far enough to see the whole country
  const MAX_ZOOM = 18;
  const zoomBy = (delta: number) =>
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));

  // Pan (drag) + pinch (zoom). Panning translates the layer live, then commits
  // the new centre on release so tiles + pins re-project cleanly.
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const commitPan = (dx: number, dy: number) => {
    setCenter((c) => {
      if (!c) return c;
      const n = 2 ** zoom;
      const cwx = lon2tile(c.lon, zoom) * TILE - dx;
      const cwy = lat2tile(c.lat, zoom) * TILE - dy;
      const lon = ((cwx / TILE) / n) * 360 - 180;
      const yy = Math.PI - (2 * Math.PI * (cwy / TILE)) / n;
      const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(yy) - Math.exp(-yy)));
      return { lat: Math.max(-84, Math.min(84, lat)), lon: ((((lon + 180) % 360) + 360) % 360) - 180 };
    });
  };
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      panX.value = e.translationX;
      panY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(commitPan)(e.translationX, e.translationY);
      panX.value = 0;
      panY.value = 0;
    });
  const pinch = Gesture.Pinch().onEnd((e) => {
    if (e.scale > 1.15) runOnJS(zoomBy)(1);
    else if (e.scale < 0.87) runOnJS(zoomBy)(-1);
  });
  const gesture = Gesture.Simultaneous(pan, pinch);
  const layerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }, { translateY: panY.value }],
  }));

  // Keep the zoom in step with the radius chips (each radius has a nice zoom),
  // and recentre on home so the chosen radius is actually shown.
  useEffect(() => {
    setZoom(ZOOM_FOR_RADIUS[radiusKm] ?? 12);
    setCenter((c) => homeLoc ?? c);
  }, [radiusKm, homeLoc]);

  // Project any lat/lon to screen pixels relative to the current centre + zoom.
  const project = useCallback(
    (lat: number, lon: number): { x: number; y: number } => {
      if (!center) return { x: -999, y: -999 };
      const cwx = lon2tile(center.lon, zoom) * TILE;
      const cwy = lat2tile(center.lat, zoom) * TILE;
      const wx = lon2tile(lon, zoom) * TILE;
      const wy = lat2tile(lat, zoom) * TILE;
      return { x: width / 2 + (wx - cwx), y: mapH / 2 + (wy - cwy) };
    },
    [center, zoom, width, mapH],
  );

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
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }, '現在地');
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
      setLocation(
        { lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) },
        hit.display_name.split(',')[0].trim() || q,
      );
    } catch {
      setSearchError(
        tx('検索に失敗しました。通信環境を確認してください。', 'Search failed. Check your connection and try again.'),
      );
    } finally {
      setSearching(false);
    }
  };

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
          uri: tileUrl(zoom, wrappedX, ty),
          left: halfW + (tx - cx) * TILE,
          top: halfH + (ty - cy) * TILE,
        });
      }
    }
    return out;
  }, [center, zoom, width, mapH]);

  // Every dog with a fixed location (seed + real remote dogs), placed on the
  // map at its true coordinates and kept to those coords as you pan/zoom.
  // Only the ones in view are rendered, so it stays fast as the world fills up.
  const dogsWithCoords = useMemo(() => {
    const seen = new Set<string>();
    return [...remoteDogs, ...SEED_DOGS].filter((d) => {
      if (d.lat == null || d.lon == null || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [remoteDogs]);

  const pins = useMemo(() => {
    if (!center) return [];
    return dogsWithCoords
      .map((dog) => ({ dog, ...project(dog.lat!, dog.lon!) }))
      .filter((p) => p.x > -50 && p.x < width + 50 && p.y > 40 && p.y < mapH + 40);
  }, [center, project, dogsWithCoords, width, mapH]);

  // Count dogs within the chosen radius of the user's actual location.
  const count = useMemo(() => {
    if (!homeLoc) return 0;
    return dogsWithCoords.filter(
      (d) => haversineKm(homeLoc.lat, homeLoc.lon, d.lat!, d.lon!) <= radiusKm,
    ).length;
  }, [homeLoc, dogsWithCoords, radiusKm]);

  const homePt = center && homeLoc ? project(homeLoc.lat, homeLoc.lon) : null;

  return (
    <View style={styles.root}>
      {/* ------------------------------------------------------- Map layer */}
      <GestureDetector gesture={gesture}>
      <View style={styles.mapLayer} onLayout={(e) => setMapH(e.nativeEvent.layout.height)}>
        {center ? (
          <>
            {/* Panning translates this whole layer live; the centre commits on
                release so tiles + pins re-project. */}
            <Animated.View style={[StyleSheet.absoluteFill, layerStyle]}>
              {tiles.map((t) => (
                <Image
                  key={t.key}
                  source={{ uri: t.uri }}
                  style={[styles.tile, { left: t.left, top: t.top }]}
                  contentFit="cover"
                  transition={120}
                />
              ))}
              {/* soft wash so the pins read on light tiles */}
              <View style={styles.mapTint} pointerEvents="none" />

              {/* you */}
              {homePt && (
                <View
                  style={[styles.youPin, { left: homePt.x - 14, top: homePt.y - 14 }]}
                  pointerEvents="none"
                >
                  <View style={styles.youDot} />
                </View>
              )}

              {/* dogs at their real, fixed coordinates */}
              {pins.map(({ dog, x, y }) => {
                const km = homeLoc
                  ? Math.round(haversineKm(homeLoc.lat, homeLoc.lon, dog.lat!, dog.lon!))
                  : dog.distanceKm;
                return (
                  <Pressable
                    key={dog.id}
                    onPress={() => router.push(`/dog/${dog.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={tx(
                      `${dog.name}のプロフィールを開く（約${km}km先）`,
                      `Open ${dog.name}’s profile (about ${km}km away)`,
                    )}
                    style={[styles.pin, { left: x - 20, top: y - 20 }]}
                  >
                    <View style={styles.pinPhotoRing}>
                      <DogPhoto dog={dog} style={styles.pinPhoto} rounded={radius.pill} emojiSize={16} />
                    </View>
                    {dog.likesYou && (
                      <View style={styles.pinHeart}>
                        <Icon name="pawFill" color={night.coral} size={9} />
                      </View>
                    )}
                    <View style={styles.pinLabel}>
                      <Text style={styles.pinLabelText} numberOfLines={1}>
                        {tx(`${dog.name}・${km}km`, `${dog.name} · ${km}km`)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>

            <Text style={styles.attribution}>{TILE_ATTRIBUTION}</Text>
          </>
        ) : (
          <View style={styles.mapPlaceholder}>
            {mode === 'locating' && <ActivityIndicator color={night.pink} size="large" />}
          </View>
        )}
      </View>
      </GestureDetector>

      {/* Zoom controls (pinch works too) */}
      {mode === 'ready' && center && (
        <View style={[styles.zoomCol, { bottom: tabClearance + 84 }]} pointerEvents="box-none">
          <Pressable
            onPress={() => zoomBy(1)}
            accessibilityRole="button"
            accessibilityLabel={tx('拡大', 'Zoom in')}
            style={({ pressed }) => [styles.zoomBtn, pressed && { opacity: 0.8 }]}
          >
            <Icon name="plus" color={night.text} size={20} />
          </Pressable>
          <Pressable
            onPress={() => zoomBy(-1)}
            accessibilityRole="button"
            accessibilityLabel={tx('縮小', 'Zoom out')}
            style={({ pressed }) => [styles.zoomBtn, styles.zoomBtnBottom, pressed && { opacity: 0.8 }]}
          >
            <Icon name="minus" color={night.text} size={20} strokeWidth={2.6} />
          </Pressable>
        </View>
      )}

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
          </>
        )}
      </SafeAreaView>

      {/* Opt-in presence — a collapsible dock at the bottom so it never covers
          the map. Collapsed to a small pill by default. */}
      {mode === 'ready' && center && (
        <View style={[styles.presenceDock, { bottom: tabClearance }]} pointerEvents="box-none">
          {presenceOpen ? (
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
                <Pressable
                  onPress={() => setPresenceOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel={tx('閉じる', 'Collapse')}
                  hitSlop={8}
                  style={styles.collapseBtn}
                >
                  <Icon name="x" color={night.muted} size={16} />
                </Pressable>
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
          ) : (
            <Pressable
              onPress={() => setPresenceOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={tx('マップに表示する', 'Show me on the map')}
              style={[styles.presencePill, availableToMeet && styles.presencePillOn]}
            >
              <Icon name="pin" color={availableToMeet ? '#fff' : night.coral} size={15} />
              <Text style={[styles.presencePillText, availableToMeet && { color: '#fff' }]}>
                {availableToMeet ? tx('マップに表示中', 'You’re on the map') : tx('マップに表示', 'Show me on the map')}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.navy },

  mapLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  tile: { position: 'absolute', width: TILE, height: TILE, backgroundColor: night.navy },
  mapTint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,253,248,0.14)' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  youPin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,107,0.3)',
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

  pin: { position: 'absolute', alignItems: 'center', width: 40 },
  pinPhotoRing: {
    padding: 1.5,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    ...shadow.soft,
  },
  pinPhoto: { width: 30, height: 30 },
  pinHeart: {
    position: 'absolute',
    top: -3,
    right: 3,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinLabel: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    maxWidth: 84,
    ...shadow.soft,
  },
  pinLabelText: { color: night.text, fontSize: 9, fontWeight: '800' },

  // Bottom-right so the presence pill (bottom-left) never covers it — the tile
  // provider's attribution has to stay visible.
  attribution: {
    position: 'absolute',
    right: spacing.sm,
    bottom: 72,
    fontSize: 9,
    color: 'rgba(60,60,60,0.65)',
  },

  overlay: { flex: 1, paddingHorizontal: spacing.lg },
  title: { fontSize: font.title, fontWeight: '900', color: night.text, marginTop: spacing.sm },

  card: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardRow: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
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

  // Bottom dock for the presence control (collapsible; never covers the map).
  presenceDock: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'flex-start' },
  presenceCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
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
  collapseBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: night.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: night.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  presencePillOn: { backgroundColor: night.coral, borderColor: night.coral },
  presencePillText: { color: night.text, fontSize: font.small, fontWeight: '800' },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  safetyText: { color: night.faint, fontSize: font.tiny, fontWeight: '600', flex: 1, lineHeight: 15 },

  // Zoom controls (bottom-right, above the tab bar).
  zoomCol: { position: 'absolute', right: spacing.lg, alignItems: 'center' },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  zoomBtnBottom: { marginTop: spacing.sm },
});
