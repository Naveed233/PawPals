import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { ChipGroup } from '@/components/form';
import { Button, Field } from '@/components/ui';
import { AGE_RANGES, AVAILABILITY, LANGUAGES } from '@/data/options';
import { JP_AVAILABILITY, JP_LANGUAGE, JP_PET_STATUS, jp } from '@/lib/jp';
import { pickPhoto } from '@/lib/media';
import { font, night, radius, spacing } from '@/theme';
import type { PetStatus } from '@/types';

export interface OwnerFormValues {
  firstName: string;
  area: string;
  bio: string;
  ageRange?: string;
  languages: string[];
  availability: string[];
  photo?: string;
  petStatus: PetStatus;
  otherPetType?: string;
}

const PET_STATUS_OPTIONS: PetStatus[] = ['has-dog', 'has-other-pet', 'no-pet-meet', 'no-pet-future'];

/** Secondary line for the no-pet options (main label comes from JP_PET_STATUS). */
const PET_STATUS_NOTE: Partial<Record<PetStatus, string>> = {
  'no-pet-meet': '飼っていない',
  'no-pet-future': '今は飼っていない',
};

/** Shared owner profile form, used for both onboarding and editing. */
export function OwnerForm({
  initial,
  submitLabel,
  onSubmit,
  onPetStatusChange,
}: {
  initial?: Partial<OwnerFormValues>;
  submitLabel: string;
  onSubmit: (values: OwnerFormValues) => void;
  /** Optional: lets the onboarding screen react to the pet-status choice. */
  onPetStatusChange?: (status: PetStatus) => void;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [zip, setZip] = useState('');
  const [zipError, setZipError] = useState<string | undefined>();
  const [zipLoading, setZipLoading] = useState(false);
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [petStatus, setPetStatus] = useState<PetStatus>(initial?.petStatus ?? 'has-dog');
  const [otherPetType, setOtherPetType] = useState(initial?.otherPetType ?? '');
  const [ageRange, setAgeRange] = useState<string | undefined>(initial?.ageRange);
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ['English']);
  const [customLanguage, setCustomLanguage] = useState('');
  const [availability, setAvailability] = useState<string[]>(initial?.availability ?? []);
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [errors, setErrors] = useState<{ firstName?: string; area?: string; otherPetType?: string }>({});

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const changePhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setPhoto(uri);
  };

  // Japanese postal-code lookup (zipcloud, Japan Post data — Japan only).
  // Fills the general area (都道府県+市区町村+町域); never a street address.
  const lookupZip = async () => {
    const digits = zip.replace(/[-ー−\s]/g, '');
    if (!/^\d{7}$/.test(digits)) {
      setZipError('7桁の郵便番号を入力してください（例：150-0002）');
      return;
    }
    setZipError(undefined);
    setZipLoading(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
      const json = (await res.json()) as {
        results?: { address1: string; address2: string; address3: string }[] | null;
      };
      const hit = json.results?.[0];
      if (hit) {
        setArea(`${hit.address1}${hit.address2}${hit.address3}`);
        setErrors((e) => ({ ...e, area: undefined }));
      } else {
        setZipError('該当する住所が見つかりませんでした');
      }
    } catch {
      setZipError('検索に失敗しました。エリアを直接入力してください。');
    } finally {
      setZipLoading(false);
    }
  };

  const selectPetStatus = (status: PetStatus) => {
    setPetStatus(status);
    onPetStatusChange?.(status);
  };

  // Preset chips + any custom languages the user added (custom ones are always
  // selected, so toggling one off removes it from the list entirely).
  const languageOptions = [...LANGUAGES, ...languages.filter((l) => !LANGUAGES.includes(l))];

  const addCustomLanguage = () => {
    const value = customLanguage.trim();
    if (!value) return;
    if (!languages.includes(value)) setLanguages([...languages, value]);
    setCustomLanguage('');
  };

  const submit = () => {
    const next: typeof errors = {};
    if (firstName.trim().length < 2) next.firstName = '名前を入力してください';
    if (area.trim().length < 2) next.area = 'おおまかなエリアを入力してください（正確な住所は不要です）';
    if (petStatus === 'has-other-pet' && otherPetType.trim().length === 0)
      next.otherPetType = 'ペットの種類を入力してください';
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
      petStatus,
      otherPetType: petStatus === 'has-other-pet' ? otherPetType.trim() : undefined,
    });
  };

  return (
    <>
      <View style={styles.photoRow}>
        <OwnerAvatar ownerId="owner-1" name={firstName || 'あなた'} uri={photo} style={styles.avatar} rounded={radius.pill} size={48} />
        <Pressable onPress={changePhoto} style={styles.photoBtn} accessibilityRole="button" accessibilityLabel="プロフィール写真を変更">
          <Text style={styles.photoBtnText}>{photo ? '写真を変更' : '写真を追加'}</Text>
        </Pressable>
      </View>

      <Field label="お名前 *" value={firstName} onChangeText={setFirstName} placeholder="例：あかり" error={errors.firstName} />

      <View style={styles.zipRow}>
        <Field
          label="郵便番号（日本）"
          value={zip}
          onChangeText={setZip}
          placeholder="例：150-0002"
          maxLength={8}
          inputMode="numeric"
          error={zipError}
          containerStyle={{ flex: 1 }}
        />
        <Pressable
          onPress={lookupZip}
          disabled={zipLoading}
          accessibilityRole="button"
          accessibilityLabel="郵便番号から住所を検索"
          accessibilityState={{ disabled: zipLoading }}
          style={[styles.zipBtn, zipLoading && { opacity: 0.6 }]}
        >
          <Text style={styles.zipBtnText}>{zipLoading ? '検索中…' : '住所検索'}</Text>
        </Pressable>
      </View>

      <Field
        label="おおまかなエリア *"
        value={area}
        onChangeText={setArea}
        placeholder="郵便番号から自動入力（編集もできます）"
        error={errors.area}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.groupLabel}>ペットについて</Text>
        <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
          {PET_STATUS_OPTIONS.map((status) => {
            const selected = petStatus === status;
            return (
              <Pressable
                key={status}
                onPress={() => selectPetStatus(status)}
                accessibilityRole="radio"
                accessibilityLabel={jp(JP_PET_STATUS, status)}
                accessibilityState={{ selected }}
                style={[styles.statusCard, selected && styles.statusCardOn]}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterOn]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusText, selected && styles.statusTextOn]}>
                    {jp(JP_PET_STATUS, status)}
                  </Text>
                  {!!PET_STATUS_NOTE[status] && (
                    <Text style={styles.statusNote}>{PET_STATUS_NOTE[status]}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
        {petStatus === 'has-other-pet' && (
          <Field
            label="ペットの種類 *"
            value={otherPetType}
            onChangeText={setOtherPetType}
            placeholder="例：猫、うさぎ"
            maxLength={30}
            error={errors.otherPetType}
          />
        )}
      </View>

      <Field label="ひとこと自己紹介" value={bio} onChangeText={setBio} placeholder="あなたのことや、どんなふうに会いたいかをひとこと" multiline numberOfLines={3} />

      <ChipGroup label="年齢層（任意）" options={AGE_RANGES} selected={ageRange ? [ageRange] : []} onToggle={(v) => setAgeRange((cur) => (cur === v ? undefined : v))} format={(v) => v} />

      <View style={{ gap: spacing.sm }}>
        <ChipGroup label="話せる言語" options={languageOptions} selected={languages} onToggle={(v) => toggle(languages, setLanguages, v)} format={(v) => jp(JP_LANGUAGE, v)} />
        <View style={styles.customLangRow}>
          <TextInput
            value={customLanguage}
            onChangeText={setCustomLanguage}
            placeholder="その他の言語を入力"
            placeholderTextColor={night.faint}
            maxLength={30}
            style={styles.customLangInput}
            accessibilityLabel="その他の言語を入力"
            onSubmitEditing={addCustomLanguage}
            returnKeyType="done"
          />
          <Pressable
            onPress={addCustomLanguage}
            accessibilityRole="button"
            accessibilityLabel="言語を追加"
            style={styles.addLangBtn}
          >
            <Text style={styles.addLangBtnText}>追加</Text>
          </Pressable>
        </View>
      </View>

      <ChipGroup label="よく空いている時間帯" options={AVAILABILITY} selected={availability} onToggle={(v) => toggle(availability, setAvailability, v)} format={(v) => jp(JP_AVAILABILITY, v)} />

      <Button label={submitLabel} onPress={submit} />
    </>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 72, height: 72 },
  photoBtn: {
    borderWidth: 1.5,
    borderColor: night.pink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: night.surface,
  },
  photoBtnText: { color: night.pink, fontWeight: '700', fontSize: font.small },

  groupLabel: { fontSize: font.small, fontWeight: '700', color: night.text },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: night.surface,
    borderWidth: 1.5,
    borderColor: night.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statusCardOn: { borderColor: night.pink, backgroundColor: night.pinkSoft },
  statusText: { fontSize: font.body, fontWeight: '600', color: night.muted },
  statusTextOn: { color: night.text, fontWeight: '700' },
  statusNote: { fontSize: font.tiny, color: night.faint, marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: night.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: { borderColor: night.pink },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: night.pink },

  zipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  zipBtn: {
    backgroundColor: night.pink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: 26, // aligns with the input (label sits above it)
  },
  zipBtnText: { color: '#fff', fontWeight: '700', fontSize: font.small },

  customLangRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  customLangInput: {
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
  addLangBtn: {
    backgroundColor: night.pink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addLangBtnText: { color: '#fff', fontWeight: '700', fontSize: font.small },
});
