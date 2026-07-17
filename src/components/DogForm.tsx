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
import { useI18n } from '@/lib/i18n';
import {
  JP_ENERGY,
  JP_INTENT,
  JP_MEETUP,
  JP_PERSONALITY,
  JP_PLAY_STYLE,
  JP_RECALL,
  JP_SEX,
  JP_SIZE,
  JP_SOCIAL,
} from '@/lib/jp';
import { pickAndUploadPhoto } from '@/lib/media';
import { font, night, radius, spacing } from '@/theme';
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
  const { tx, tv } = useI18n();
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
    const uri = await pickAndUploadPhoto();
    if (uri) setPhotos((p) => [...p, uri]);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 1) next.name = tx('お名前を入力してください', "Please enter your dog's name");
    if (breed.trim().length < 2) next.breed = tx('犬種またはミックスを入力してください', 'Please enter a breed or mix');
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 30) next.age = tx('年齢（歳）を入力してください', 'Please enter an age in years');
    if (!sex) next.sex = tx('選択してください', 'Please select one');
    if (!size) next.size = tx('選択してください', 'Please select one');
    if (!energy) next.energy = tx('選択してください', 'Please select one');
    if (personality.length === 0) next.personality = tx('1つ以上選んでください', 'Pick at least one');
    if (playStyle.length === 0) next.playStyle = tx('1つ以上選んでください', 'Pick at least one');
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
        <SectionTitle>{tx('写真', 'Photos')}</SectionTitle>
        <View style={styles.photoRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} contentFit="cover" />
          ))}
          <Pressable onPress={addPhoto} style={styles.addPhoto} accessibilityRole="button" accessibilityLabel={tx('写真を追加', 'Add photo')}>
            <Text style={styles.addPhotoPlus}>＋</Text>
            <Text style={styles.addPhotoText}>{tx('追加', 'Add')}</Text>
          </Pressable>
        </View>
        <Text style={styles.photoHint}>{tx('任意 — 写真がなくてもかわいいアバターを表示します。', 'Optional — no photo? We’ll show a cute avatar instead.')}</Text>
      </Card>

      <Field label={tx('お名前 *', 'Name *')} value={name} onChangeText={setName} placeholder={tx('例：ビスケット', 'e.g. Biscuit')} error={errors.name} />
      <Field label={tx('犬種・ミックス *', 'Breed or mix *')} value={breed} onChangeText={setBreed} placeholder={tx('例：ラブラドールミックス', 'e.g. Labrador mix')} error={errors.breed} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Field label={tx('年齢（歳）*', 'Age (years) *')} value={age} onChangeText={setAge} placeholder="3" keyboardType="numeric" error={errors.age} containerStyle={{ flex: 1 }} />
        <Field label={tx('体重（kg）', 'Weight (kg)')} value={weight} onChangeText={setWeight} placeholder="18" keyboardType="numeric" containerStyle={{ flex: 1 }} />
      </View>

      <ChipGroup label={tx('性別 *', 'Sex *')} options={SEXES} selected={sex ? [sex] : []} onToggle={(v) => setSex(v)} error={errors.sex} format={(v) => tv(JP_SEX, v)} />
      <ChipGroup label={tx('サイズ *', 'Size *')} options={SIZES} selected={size ? [size] : []} onToggle={(v) => setSize(v)} error={errors.size} format={(v) => tv(JP_SIZE, v)} />
      <ChipGroup label={tx('元気さ *', 'Energy *')} options={ENERGY_LEVELS} selected={energy ? [energy] : []} onToggle={(v) => setEnergy(v)} error={errors.energy} format={(v) => tv(JP_ENERGY, v)} />
      <ChipGroup label={tx('社交性', 'Sociability')} options={SOCIAL_LEVELS} selected={[social]} onToggle={(v) => setSocial(v)} format={(v) => tv(JP_SOCIAL, v)} />

      <ChipGroup label={tx('性格 *（いくつでも）', 'Personality * (pick any)')} options={PERSONALITY_TAGS} selected={personality} onToggle={(v) => toggleTag(personality, setPersonality, v)} error={errors.personality} format={(v) => tv(JP_PERSONALITY, v)} />
      <ChipGroup label={tx('遊び方 *', 'Play style *')} options={PLAY_STYLE_TAGS} selected={playStyle} onToggle={(v) => toggleTag(playStyle, setPlayStyle, v)} error={errors.playStyle} format={(v) => tv(JP_PLAY_STYLE, v)} />
      <ChipGroup label={tx('呼び戻し', 'Recall')} options={RECALL_OPTIONS} selected={[recall]} onToggle={(v) => setRecall(v)} format={(v) => tv(JP_RECALL, v)} />
      <ChipGroup label={tx('希望の会い方', 'Preferred first meetup')} options={MEETUP_TYPES} selected={[meetupPref]} onToggle={(v) => setMeetupPref(v)} format={(v) => tv(JP_MEETUP, v)} />
      <ChipGroup label={tx('探しているもの', 'Looking for')} options={INTENTS} selected={intents} onToggle={(v) => setIntents((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))} format={(v) => tv(JP_INTENT, v)} />

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle>{tx('健康・相性', 'Health & compatibility')}</SectionTitle>
        <ToggleRow label={tx('ワクチン接種済み', 'Vaccinated')} value={vaccinated} onValueChange={setVaccinated} />
        <ToggleRow label={tx('去勢・避妊済み', 'Spayed/neutered')} value={neutered} onValueChange={setNeutered} />
        <ToggleRow label={tx('小型犬と仲良くできる', 'Good with small dogs')} value={goodWith.smallDogs} onValueChange={(v) => setGoodWith({ ...goodWith, smallDogs: v })} />
        <ToggleRow label={tx('大型犬と仲良くできる', 'Good with large dogs')} value={goodWith.largeDogs} onValueChange={(v) => setGoodWith({ ...goodWith, largeDogs: v })} />
        <ToggleRow label={tx('子犬と仲良くできる', 'Good with puppies')} value={goodWith.puppies} onValueChange={(v) => setGoodWith({ ...goodWith, puppies: v })} />
        <ToggleRow label={tx('シニア犬と仲良くできる', 'Good with senior dogs')} value={goodWith.seniors} onValueChange={(v) => setGoodWith({ ...goodWith, seniors: v })} />
        <ToggleRow label={tx('子どもと仲良くできる', 'Good with children')} value={goodWith.children} onValueChange={(v) => setGoodWith({ ...goodWith, children: v })} />
      </Card>

      <Field label={tx('性格・行動メモ', 'Personality & behaviour notes')} value={notes} onChangeText={setNotes} placeholder={tx('新しい友だちと会うときの様子など', 'How they act when meeting new friends')} multiline numberOfLines={2} />
      <Field label={tx('苦手なこと・避けたい状況', 'Dislikes & situations to avoid')} value={avoid} onChangeText={setAvoid} placeholder={tx('相手に知っておいてほしいこと', 'Anything other owners should know')} multiline numberOfLines={2} />

      <Text style={styles.disclaimer}>
        {tx(
          '愛犬の見守りと、ミートアップが適切かどうかの判断は飼い主さまの責任です。 相性スコアは、犬の安全性やフレンドリーさを保証するものではありません。',
          'You are responsible for supervising your dog and deciding whether a meetup is appropriate. Compatibility scores are no guarantee of a dog’s safety or friendliness.',
        )}
      </Text>

      <Button label={submitLabel} onPress={submit} />
    </>
  );
}

const styles = StyleSheet.create({
  disclaimer: { fontSize: font.tiny, color: night.muted, lineHeight: 16 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoThumb: { width: 72, height: 90, borderRadius: radius.md, backgroundColor: night.surface },
  addPhoto: {
    width: 72,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: night.pink,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: night.surface,
  },
  addPhotoPlus: { fontSize: 24, color: night.pink, fontWeight: '700', lineHeight: 26 },
  addPhotoText: { fontSize: font.tiny, color: night.pink, fontWeight: '700' },
  photoHint: { fontSize: font.tiny, color: night.faint },
});
