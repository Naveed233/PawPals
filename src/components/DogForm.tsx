import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipGroup, ToggleRow } from '@/components/form';
import { Button, Card, Field, SectionTitle } from '@/components/ui';
import {
  ENERGY_LEVELS,
  INTENTS,
  MEETUP_TYPES,
  PERSONALITY_TAGS,
  PLAY_STYLE_TAGS,
  SEXES,
  SIZES,
  SOCIAL_LEVELS,
} from '@/data/options';
import { pickPhoto } from '@/lib/media';
import { colors, font, radius, spacing } from '@/theme';
import type { Energy, GoodWith, Intent, MeetupType, Recall, Sex, Size, SocialLevel } from '@/types';

const RECALL_OPTIONS: Recall[] = ['reliable', 'improving', 'on-leash only'];

export interface DogFormValues {
  photos: string[];
  intents: Intent[];
  name: string;
  breed: string;
  ageYears: number;
  weightKg: number;
  sex: Sex;
  size: Size;
  energy: Energy;
  social: SocialLevel;
  personality: string[];
  playStyle: string[];
  recall: Recall;
  meetupPref: MeetupType;
  vaccinated: boolean;
  neutered: boolean;
  goodWith: GoodWith;
  notes?: string;
  avoid?: string;
}

/** Shared dog profile form, used for both onboarding and editing. */
export function DogForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<DogFormValues>;
  submitLabel: string;
  onSubmit: (values: DogFormValues) => void;
}) {
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [intents, setIntents] = useState<Intent[]>(initial?.intents ?? ['Dog playdates']);
  const [name, setName] = useState(initial?.name ?? '');
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [age, setAge] = useState(initial?.ageYears != null ? String(initial.ageYears) : '');
  const [weight, setWeight] = useState(initial?.weightKg ? String(initial.weightKg) : '');
  const [sex, setSex] = useState<Sex | undefined>(initial?.sex);
  const [size, setSize] = useState<Size | undefined>(initial?.size);
  const [energy, setEnergy] = useState<Energy | undefined>(initial?.energy);
  const [social, setSocial] = useState<SocialLevel>(initial?.social ?? 'social');
  const [personality, setPersonality] = useState<string[]>(initial?.personality ?? []);
  const [playStyle, setPlayStyle] = useState<string[]>(initial?.playStyle ?? []);
  const [recall, setRecall] = useState<Recall>(initial?.recall ?? 'improving');
  const [meetupPref, setMeetupPref] = useState<MeetupType>(initial?.meetupPref ?? 'Leash walk');
  const [vaccinated, setVaccinated] = useState(initial?.vaccinated ?? true);
  const [neutered, setNeutered] = useState(initial?.neutered ?? false);
  const [goodWith, setGoodWith] = useState<GoodWith>(
    initial?.goodWith ?? { smallDogs: true, largeDogs: true, puppies: true, seniors: true, children: true },
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [avoid, setAvoid] = useState(initial?.avoid ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTag = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const addPhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setPhotos((p) => [...p, uri]);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 1) next.name = "Enter your dog's name";
    if (breed.trim().length < 2) next.breed = 'Enter a breed or mix';
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 30) next.age = 'Enter an age in years';
    if (!sex) next.sex = 'Select one';
    if (!size) next.size = 'Select one';
    if (!energy) next.energy = 'Select one';
    if (personality.length === 0) next.personality = 'Pick at least one';
    if (playStyle.length === 0) next.playStyle = 'Pick at least one';
    setErrors(next);
    if (Object.keys(next).length > 0 || !sex || !size || !energy) return;

    onSubmit({
      photos,
      intents: intents.length > 0 ? intents : ['Dog playdates'],
      name: name.trim(),
      breed: breed.trim(),
      ageYears: ageNum,
      weightKg: Number(weight) || 0,
      sex,
      size,
      energy,
      social,
      personality,
      playStyle,
      recall,
      meetupPref,
      vaccinated,
      neutered,
      goodWith,
      notes: notes.trim() || undefined,
      avoid: avoid.trim() || undefined,
    });
  };

  return (
    <>
      <Card style={{ gap: spacing.md }}>
        <SectionTitle>Photos</SectionTitle>
        <View style={styles.photoRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} contentFit="cover" />
          ))}
          <Pressable onPress={addPhoto} style={styles.addPhoto} accessibilityRole="button" accessibilityLabel="Add photo">
            <Text style={styles.addPhotoPlus}>＋</Text>
            <Text style={styles.addPhotoText}>Add</Text>
          </Pressable>
        </View>
        <Text style={styles.photoHint}>Optional — no photo? We'll show a friendly avatar.</Text>
      </Card>

      <Field label="Name *" value={name} onChangeText={setName} placeholder="e.g. Biscuit" error={errors.name} />
      <Field label="Breed or mix *" value={breed} onChangeText={setBreed} placeholder="e.g. Labrador mix" error={errors.breed} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Field label="Age (years) *" value={age} onChangeText={setAge} placeholder="3" keyboardType="numeric" error={errors.age} containerStyle={{ flex: 1 }} />
        <Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="18" keyboardType="numeric" containerStyle={{ flex: 1 }} />
      </View>

      <ChipGroup label="Sex *" options={SEXES} selected={sex ? [sex] : []} onToggle={(v) => setSex(v)} error={errors.sex} />
      <ChipGroup label="Size *" options={SIZES} selected={size ? [size] : []} onToggle={(v) => setSize(v)} error={errors.size} />
      <ChipGroup label="Energy level *" options={ENERGY_LEVELS} selected={energy ? [energy] : []} onToggle={(v) => setEnergy(v)} error={errors.energy} />
      <ChipGroup label="Socialisation" options={SOCIAL_LEVELS} selected={[social]} onToggle={(v) => setSocial(v)} />

      <ChipGroup label="Personality * (pick a few)" options={PERSONALITY_TAGS} selected={personality} onToggle={(v) => toggleTag(personality, setPersonality, v)} error={errors.personality} />
      <ChipGroup label="Play style *" options={PLAY_STYLE_TAGS} selected={playStyle} onToggle={(v) => toggleTag(playStyle, setPlayStyle, v)} error={errors.playStyle} />
      <ChipGroup label="Recall" options={RECALL_OPTIONS} selected={[recall]} onToggle={(v) => setRecall(v)} />
      <ChipGroup label="Ideal meetup" options={MEETUP_TYPES} selected={[meetupPref]} onToggle={(v) => setMeetupPref(v)} />
      <ChipGroup label="Looking for" options={INTENTS} selected={intents} onToggle={(v) => setIntents((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))} />

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle>Health & comfort</SectionTitle>
        <ToggleRow label="Vaccinations up to date" value={vaccinated} onValueChange={setVaccinated} />
        <ToggleRow label="Neutered / spayed" value={neutered} onValueChange={setNeutered} />
        <ToggleRow label="Good with small dogs" value={goodWith.smallDogs} onValueChange={(v) => setGoodWith({ ...goodWith, smallDogs: v })} />
        <ToggleRow label="Good with large dogs" value={goodWith.largeDogs} onValueChange={(v) => setGoodWith({ ...goodWith, largeDogs: v })} />
        <ToggleRow label="Good with puppies" value={goodWith.puppies} onValueChange={(v) => setGoodWith({ ...goodWith, puppies: v })} />
        <ToggleRow label="Good with senior dogs" value={goodWith.seniors} onValueChange={(v) => setGoodWith({ ...goodWith, seniors: v })} />
        <ToggleRow label="Good with children" value={goodWith.children} onValueChange={(v) => setGoodWith({ ...goodWith, children: v })} />
      </Card>

      <Field label="Behaviour notes" value={notes} onChangeText={setNotes} placeholder="How your dog likes to meet new friends" multiline numberOfLines={2} />
      <Field label="Triggers / situations to avoid" value={avoid} onChangeText={setAvoid} placeholder="Anything a match should know" multiline numberOfLines={2} />

      <Text style={styles.disclaimer}>
        You are responsible for supervising your dog and deciding whether any meetup is appropriate.
        A compatibility score never means a dog is guaranteed safe or friendly.
      </Text>

      <Button label={submitLabel} onPress={submit} />
    </>
  );
}

const styles = StyleSheet.create({
  disclaimer: { fontSize: font.tiny, color: colors.muted, lineHeight: 16 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoThumb: { width: 72, height: 90, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  addPhoto: {
    width: 72,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoPlus: { fontSize: 24, color: colors.forest, fontWeight: '700', lineHeight: 26 },
  addPhotoText: { fontSize: font.tiny, color: colors.forest, fontWeight: '700' },
  photoHint: { fontSize: font.tiny, color: colors.faint },
});
