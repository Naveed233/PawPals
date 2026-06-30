import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { ChipGroup } from '@/components/form';
import { Button, Field } from '@/components/ui';
import { AGE_RANGES, AVAILABILITY, LANGUAGES } from '@/data/options';
import { pickPhoto } from '@/lib/media';
import { colors, font, radius, spacing } from '@/theme';

export interface OwnerFormValues {
  firstName: string;
  area: string;
  bio: string;
  ageRange?: string;
  languages: string[];
  availability: string[];
  photo?: string;
}

/** Shared owner profile form, used for both onboarding and editing. */
export function OwnerForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<OwnerFormValues>;
  submitLabel: string;
  onSubmit: (values: OwnerFormValues) => void;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [ageRange, setAgeRange] = useState<string | undefined>(initial?.ageRange);
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ['English']);
  const [availability, setAvailability] = useState<string[]>(initial?.availability ?? []);
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [errors, setErrors] = useState<{ firstName?: string; area?: string }>({});

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const changePhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setPhoto(uri);
  };

  const submit = () => {
    const next: typeof errors = {};
    if (firstName.trim().length < 2) next.firstName = 'Please enter your first name';
    if (area.trim().length < 2) next.area = 'Enter a general area (not your full address)';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      firstName: firstName.trim(),
      area: area.trim(),
      bio: bio.trim(),
      ageRange,
      languages,
      availability,
      photo,
    });
  };

  return (
    <>
      <View style={styles.photoRow}>
        <OwnerAvatar ownerId="owner-1" name={firstName || 'You'} uri={photo} style={styles.avatar} rounded={radius.pill} size={48} />
        <Pressable onPress={changePhoto} style={styles.photoBtn} accessibilityLabel="Change your photo">
          <Text style={styles.photoBtnText}>{photo ? 'Change photo' : 'Add your photo'}</Text>
        </Pressable>
      </View>

      <Field label="First name *" value={firstName} onChangeText={setFirstName} placeholder="e.g. Alex" error={errors.firstName} />
      <Field label="General area *" value={area} onChangeText={setArea} placeholder="e.g. Riverside (neighbourhood, not address)" error={errors.area} />
      <Field label="Short bio" value={bio} onChangeText={setBio} placeholder="A line about you and how you like to meet up" multiline numberOfLines={3} />

      <ChipGroup label="Age range (optional)" options={AGE_RANGES} selected={ageRange ? [ageRange] : []} onToggle={(v) => setAgeRange((cur) => (cur === v ? undefined : v))} />
      <ChipGroup label="Languages" options={LANGUAGES} selected={languages} onToggle={(v) => toggle(languages, setLanguages, v)} />
      <ChipGroup label="Typical availability" options={AVAILABILITY} selected={availability} onToggle={(v) => toggle(availability, setAvailability, v)} />

      <Button label={submitLabel} onPress={submit} />
    </>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 72, height: 72 },
  photoBtn: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  photoBtnText: { color: colors.forest, fontWeight: '700', fontSize: font.small },
});
