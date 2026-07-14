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
  jp,
} from '@/lib/jp';
import { pickPhoto } from '@/lib/media';
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
    if (name.trim().length < 1) next.name = 'お名前を入力してください';
    if (breed.trim().length < 2) next.breed = '犬種またはミックスを入力してください';
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 30) next.age = '年齢（歳）を入力してください';
    if (!sex) next.sex = '選択してください';
    if (!size) next.size = '選択してください';
    if (!energy) next.energy = '選択してください';
    if (personality.length === 0) next.personality = '1つ以上選んでください';
    if (playStyle.length === 0) next.playStyle = '1つ以上選んでください';
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
        <SectionTitle>写真</SectionTitle>
        <View style={styles.photoRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} contentFit="cover" />
          ))}
          <Pressable onPress={addPhoto} style={styles.addPhoto} accessibilityRole="button" accessibilityLabel="写真を追加">
            <Text style={styles.addPhotoPlus}>＋</Text>
            <Text style={styles.addPhotoText}>追加</Text>
          </Pressable>
        </View>
        <Text style={styles.photoHint}>任意 — 写真がなくてもかわいいアバターを表示します。</Text>
      </Card>

      <Field label="お名前 *" value={name} onChangeText={setName} placeholder="例：ビスケット" error={errors.name} />
      <Field label="犬種・ミックス *" value={breed} onChangeText={setBreed} placeholder="例：ラブラドールミックス" error={errors.breed} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Field label="年齢（歳）*" value={age} onChangeText={setAge} placeholder="3" keyboardType="numeric" error={errors.age} containerStyle={{ flex: 1 }} />
        <Field label="体重（kg）" value={weight} onChangeText={setWeight} placeholder="18" keyboardType="numeric" containerStyle={{ flex: 1 }} />
      </View>

      <ChipGroup label="性別 *" options={SEXES} selected={sex ? [sex] : []} onToggle={(v) => setSex(v)} error={errors.sex} format={(v) => jp(JP_SEX, v)} />
      <ChipGroup label="サイズ *" options={SIZES} selected={size ? [size] : []} onToggle={(v) => setSize(v)} error={errors.size} format={(v) => jp(JP_SIZE, v)} />
      <ChipGroup label="元気さ *" options={ENERGY_LEVELS} selected={energy ? [energy] : []} onToggle={(v) => setEnergy(v)} error={errors.energy} format={(v) => jp(JP_ENERGY, v)} />
      <ChipGroup label="社交性" options={SOCIAL_LEVELS} selected={[social]} onToggle={(v) => setSocial(v)} format={(v) => jp(JP_SOCIAL, v)} />

      <ChipGroup label="性格 *（いくつでも）" options={PERSONALITY_TAGS} selected={personality} onToggle={(v) => toggleTag(personality, setPersonality, v)} error={errors.personality} format={(v) => jp(JP_PERSONALITY, v)} />
      <ChipGroup label="遊び方 *" options={PLAY_STYLE_TAGS} selected={playStyle} onToggle={(v) => toggleTag(playStyle, setPlayStyle, v)} error={errors.playStyle} format={(v) => jp(JP_PLAY_STYLE, v)} />
      <ChipGroup label="呼び戻し" options={RECALL_OPTIONS} selected={[recall]} onToggle={(v) => setRecall(v)} format={(v) => jp(JP_RECALL, v)} />
      <ChipGroup label="希望の会い方" options={MEETUP_TYPES} selected={[meetupPref]} onToggle={(v) => setMeetupPref(v)} format={(v) => jp(JP_MEETUP, v)} />
      <ChipGroup label="探しているもの" options={INTENTS} selected={intents} onToggle={(v) => setIntents((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))} format={(v) => jp(JP_INTENT, v)} />

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle>健康・相性</SectionTitle>
        <ToggleRow label="ワクチン接種済み" value={vaccinated} onValueChange={setVaccinated} />
        <ToggleRow label="去勢・避妊済み" value={neutered} onValueChange={setNeutered} />
        <ToggleRow label="小型犬と仲良くできる" value={goodWith.smallDogs} onValueChange={(v) => setGoodWith({ ...goodWith, smallDogs: v })} />
        <ToggleRow label="大型犬と仲良くできる" value={goodWith.largeDogs} onValueChange={(v) => setGoodWith({ ...goodWith, largeDogs: v })} />
        <ToggleRow label="子犬と仲良くできる" value={goodWith.puppies} onValueChange={(v) => setGoodWith({ ...goodWith, puppies: v })} />
        <ToggleRow label="シニア犬と仲良くできる" value={goodWith.seniors} onValueChange={(v) => setGoodWith({ ...goodWith, seniors: v })} />
        <ToggleRow label="子どもと仲良くできる" value={goodWith.children} onValueChange={(v) => setGoodWith({ ...goodWith, children: v })} />
      </Card>

      <Field label="性格・行動メモ" value={notes} onChangeText={setNotes} placeholder="新しい友だちと会うときの様子など" multiline numberOfLines={2} />
      <Field label="苦手なこと・避けたい状況" value={avoid} onChangeText={setAvoid} placeholder="相手に知っておいてほしいこと" multiline numberOfLines={2} />

      <Text style={styles.disclaimer}>
        愛犬の見守りと、ミートアップが適切かどうかの判断は飼い主さまの責任です。
        相性スコアは、犬の安全性やフレンドリーさを保証するものではありません。
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
