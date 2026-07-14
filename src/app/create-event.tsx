import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip, Field } from '@/components/ui';
import { MEETUP_TYPES } from '@/data/options';
import { JP_MEETUP, jp } from '@/lib/jp';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';
import type { MeetupType } from '@/types';

export default function CreateEvent() {
  const router = useRouter();
  const owner = useStore((s) => s.owner);
  const createEvent = useStore((s) => s.createEvent);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetupType>('Group walk');
  const [locationName, setLocationName] = useState('');
  const [area, setArea] = useState(owner?.area ?? '');
  const [dateLabel, setDateLabel] = useState('');
  const [timeLabel, setTimeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = 'イベントのタイトルを入力してください';
    if (locationName.trim().length < 3) next.locationName = '公共の集合場所を入力してください';
    if (dateLabel.trim().length < 2) next.dateLabel = '日付を入力してください';
    if (timeLabel.trim().length < 2) next.timeLabel = '時間を入力してください';
    setErrors(next);
    if (Object.keys(next).length > 0 || !owner) return;

    const id = createEvent({
      title: title.trim(),
      type,
      hostOwnerId: owner.id,
      hostName: owner.firstName,
      locationName: locationName.trim(),
      area: area.trim() || owner.area,
      dateLabel: dateLabel.trim(),
      timeLabel: timeLabel.trim(),
      description: description.trim(),
      attendeeCount: 0,
    });
    router.replace(`/event/${id}`);
  };

  return (
    <Screen title="イベントを主催" onBack={() => router.back()}>
      <Field label="タイトル *" value={title} onChangeText={setTitle} placeholder="例：日曜ビーチさんぽ" error={errors.title} />

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.typeLabel}>タイプ</Text>
        <View style={styles.typeRow}>
          {MEETUP_TYPES.map((t) => (
            <Chip key={t} label={jp(JP_MEETUP, t)} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </View>

      <Field
        label="公共の集合場所 *"
        value={locationName}
        onChangeText={setLocationName}
        placeholder="例：リバーサイド・ドッグパーク"
        error={errors.locationName}
      />
      <Field label="おおまかなエリア" value={area} onChangeText={setArea} placeholder="例：リバーサイド" />
      <Field label="日付 *" value={dateLabel} onChangeText={setDateLabel} placeholder="例：7月12日（土）" error={errors.dateLabel} />
      <Field label="時間 *" value={timeLabel} onChangeText={setTimeLabel} placeholder="例：午前10:00" error={errors.timeLabel} />
      <Field
        label="説明"
        value={description}
        onChangeText={setDescription}
        placeholder="対象の犬、持ち物、雰囲気など…"
        multiline
        numberOfLines={3}
      />

      <Button label="イベントを公開する" onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  typeLabel: { fontSize: font.small, fontWeight: '700', color: night.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
