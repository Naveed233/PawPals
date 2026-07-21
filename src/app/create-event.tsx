import { useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Chip, Field } from '@/components/ui';
import { MEETUP_TYPES } from '@/data/options';
import { useI18n } from '@/lib/i18n';
import { JP_MEETUP } from '@/lib/jp';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';
import type { MeetupType } from '@/types';

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
  const [dateLabel, setDateLabel] = useState('');
  const [timeLabel, setTimeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3)
      next.title = tx('イベントのタイトルを入力してください', 'Please enter an event title');
    if (locationName.trim().length < 3)
      next.locationName = tx('公共の集合場所を入力してください', 'Please enter a public meeting spot');
    if (dateLabel.trim().length < 2) next.dateLabel = tx('日付を入力してください', 'Please enter a date');
    if (timeLabel.trim().length < 2) next.timeLabel = tx('時間を入力してください', 'Please enter a time');
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

      <Field
        label={tx('公共の集合場所 *', 'Public meeting spot *')}
        value={locationName}
        onChangeText={setLocationName}
        placeholder={tx('例：リバーサイド・ドッグパーク', 'e.g. Riverside Dog Park')}
        error={errors.locationName}
      />
      <Field
        label={tx('おおまかなエリア', 'General area')}
        value={area}
        onChangeText={setArea}
        placeholder={tx('例：リバーサイド', 'e.g. Riverside')}
      />
      <Field
        label={tx('日付 *', 'Date *')}
        value={dateLabel}
        onChangeText={setDateLabel}
        placeholder={tx('例：7月12日（土）', 'e.g. Sat 12 Jul')}
        error={errors.dateLabel}
      />
      <Field
        label={tx('時間 *', 'Time *')}
        value={timeLabel}
        onChangeText={setTimeLabel}
        placeholder={tx('例：午前10:00', 'e.g. 10:00 AM')}
        error={errors.timeLabel}
      />
      <Field
        label={tx('説明', 'Description')}
        value={description}
        onChangeText={setDescription}
        placeholder={tx('対象の犬、持ち物、雰囲気など…', 'Which dogs it’s for, what to bring, the vibe…')}
        multiline
        numberOfLines={3}
      />

      <Button label={tx('イベントを公開する', 'Publish event')} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  typeLabel: { fontSize: font.small, fontWeight: '700', color: night.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
