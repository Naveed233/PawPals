import { useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { Button, Chip, Field } from '@/components/ui';
import { MEETUP_TYPES } from '@/data/options';
import { useI18n } from '@/lib/i18n';
import { JP_MEETUP } from '@/lib/jp';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';
import type { MeetupType } from '@/types';

/** Two-digit local now, as an <input datetime-local> value: "YYYY-MM-DDTHH:MM". */
function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Turn a local datetime string into the display labels + ISO the app uses. */
function labelsFromLocal(local: string): { dateLabel: string; timeLabel: string; iso: string } {
  const d = new Date(local);
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return {
    dateLabel: `${dow} ${d.getDate()} ${mon}`,
    timeLabel: `${h}:${String(m).padStart(2, '0')} ${ampm}`,
    iso: d.toISOString(),
  };
}

/** Best-effort geocode → coarse (~1km) coords. Never stores an exact address.
 * Times out fast (5s) so publishing can never hang on the network. */
async function coarseGeocode(query: string): Promise<{ lat?: number; lon?: number }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ja&countrycodes=jp&q=${encodeURIComponent(query)}`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    const json = (await res.json()) as { lat: string; lon: string }[];
    const hit = json[0];
    if (hit) {
      return {
        lat: Math.round(parseFloat(hit.lat) * 100) / 100,
        lon: Math.round(parseFloat(hit.lon) * 100) / 100,
      };
    }
  } catch {
    /* offline / rate-limited / timed out — location coords are optional */
  }
  return {};
}

export default function CreateEvent() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)/events');
  const { tx, tv } = useI18n();
  const owner = useStore((s) => s.owner);
  const createEvent = useStore((s) => s.createEvent);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetupType>('Group walk');
  const [locationName, setLocationName] = useState('');
  const [area, setArea] = useState(owner?.area ?? '');
  const [when, setWhen] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3)
      next.title = tx('イベントのタイトルを入力してください', 'Please enter an event title');
    if (locationName.trim().length < 3)
      next.locationName = tx('公共の集合場所を入力してください', 'Please enter a public meeting spot');
    if (!when) next.when = tx('日時を選んでください', 'Please pick a date & time');
    else if (new Date(when).getTime() < Date.now())
      next.when = tx('未来の日時を選んでください', 'Please pick a future date & time');
    setErrors(next);
    if (Object.keys(next).length > 0 || !owner) return;

    setSaving(true);
    const { dateLabel, timeLabel, iso } = labelsFromLocal(when);
    const areaVal = area.trim() || owner.area;
    const { lat, lon } = await coarseGeocode(`${locationName.trim()} ${areaVal}`.trim());

    const id = createEvent({
      title: title.trim(),
      type,
      hostOwnerId: owner.id,
      hostName: owner.firstName,
      locationName: locationName.trim(),
      area: areaVal,
      dateLabel,
      timeLabel,
      description: description.trim(),
      attendeeCount: 0,
      startsAt: iso,
      lat,
      lon,
    });
    router.replace(`/event/${id}`);
  };

  return (
    <Screen title={tx('イベントを主催', 'Host an Event')} onBack={() => goBack()}>
      <Field
        label={tx('タイトル *', 'Title *')}
        value={title}
        onChangeText={setTitle}
        placeholder={tx('例：日曜ビーチさんぽ', 'e.g. Sunday beach stroll')}
        error={errors.title}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.typeLabel}>{tx('タイプ', 'Type')}</Text>
        <View style={styles.typeRow}>
          {MEETUP_TYPES.map((t) => (
            <Chip key={t} label={tv(JP_MEETUP, t)} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </View>

      <DateTimeField
        label={tx('日時 *', 'Date & time *')}
        value={when}
        onChange={setWhen}
        min={nowLocal()}
        error={errors.when}
      />

      <Field
        label={tx('公共の集合場所 *', 'Public meeting spot *')}
        value={locationName}
        onChangeText={setLocationName}
        placeholder={tx('例：代々木公園 ドッグラン', 'e.g. Yoyogi Park dog run')}
        error={errors.locationName}
      />
      <Field
        label={tx('おおまかなエリア', 'General area')}
        value={area}
        onChangeText={setArea}
        placeholder={tx('例：渋谷区', 'e.g. Shibuya')}
      />
      <Field
        label={tx('説明', 'Description')}
        value={description}
        onChangeText={setDescription}
        placeholder={tx('対象の犬、持ち物、雰囲気など…', 'Which dogs it’s for, what to bring, the vibe…')}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.safety}>
        {tx(
          '集合場所はおおよその位置のみ地図に表示され、正確な住所は公開されません。必ず犬同伴OKの公共の場所を選んでください。',
          'Only an approximate location is shown on the map — never an exact address. Always choose a public, dog-friendly spot.',
        )}
      </Text>

      <Button
        label={saving ? tx('公開中…', 'Publishing…') : tx('イベントを公開する', 'Publish event')}
        onPress={submit}
        disabled={saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  typeLabel: { fontSize: font.small, fontWeight: '700', color: night.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  safety: { fontSize: font.tiny, color: night.faint, lineHeight: 16 },
});
