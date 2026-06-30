import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ChipGroup } from '@/components/form';
import { Screen } from '@/components/Screen';
import { Button, Field } from '@/components/ui';
import { MEETUP_TYPES } from '@/data/options';
import { useStore } from '@/store';
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
    if (title.trim().length < 3) next.title = 'Give your event a title';
    if (locationName.trim().length < 3) next.locationName = 'Add a public meeting place';
    if (dateLabel.trim().length < 2) next.dateLabel = 'Add a date';
    if (timeLabel.trim().length < 2) next.timeLabel = 'Add a time';
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
    <Screen title="Host an event" onBack={() => router.back()}>
      <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Beach Walk" error={errors.title} />
      <ChipGroup label="Type" options={MEETUP_TYPES} selected={[type]} onToggle={(v) => setType(v)} />
      <Field label="Public meeting place *" value={locationName} onChangeText={setLocationName} placeholder="e.g. Riverside Dog Park" error={errors.locationName} />
      <Field label="General area" value={area} onChangeText={setArea} placeholder="e.g. Riverside" />
      <Field label="Date *" value={dateLabel} onChangeText={setDateLabel} placeholder="e.g. Sat 12 Jul" error={errors.dateLabel} />
      <Field label="Time *" value={timeLabel} onChangeText={setTimeLabel} placeholder="e.g. 10:00 AM" error={errors.timeLabel} />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Who's it for, what to bring, the vibe…" multiline numberOfLines={3} />

      <Button label="Publish event" onPress={submit} />
    </Screen>
  );
}
