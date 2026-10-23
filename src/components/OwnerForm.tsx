import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { OwnerAvatar } from '@/components/Avatar';
import { ChipGroup } from '@/components/form';
import { Button, Field } from '@/components/ui';
import { AGE_RANGES, AVAILABILITY, LANGUAGES } from '@/data/options';
import { useI18n } from '@/lib/i18n';
import { EN_PET_STATUS, JP_AVAILABILITY, JP_LANGUAGE, JP_PET_STATUS } from '@/lib/jp';
import { pickAndUploadPhoto } from '@/lib/media';
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
  /** Coarse coordinates (~1km) derived from the area, for real distance/map. */
  lat?: number;
  lon?: number;
}

const PET_STATUS_OPTIONS: PetStatus[] = ['has-dog', 'has-other-pet', 'no-pet-meet', 'no-pet-future'];

/** Secondary line for the no-pet options (main label comes from JP_PET_STATUS). */
const PET_STATUS_NOTE: Partial<Record<PetStatus, [ja: string, en: string]>> = {
  'no-pet-meet': ['飼っていない', "Doesn't have a pet"],
  'no-pet-future': ['今は飼っていない', 'No pet right now'],
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
  const { tx, tv } = useI18n();
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
  const [coords, setCoords] = useState<{ lat: number; lon: number } | undefined>(
    initial?.lat != null && initial?.lon != null ? { lat: initial.lat, lon: initial.lon } : undefined,
  );
  const [errors, setErrors] = useState<{ firstName?: string; area?: string; otherPetType?: string }>({});

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const changePhoto = async () => {
    const uri = await pickAndUploadPhoto();
    if (uri) setPhoto(uri);
  };

  // Japanese postal-code lookup (zipcloud, Japan Post data — Japan only).
  // Fills the general area (都道府県+市区町村+町域); never a street address.
  const lookupZip = async () => {
    const digits = zip.replace(/[-ー−\s]/g, '');
    if (!/^\d{7}$/.test(digits)) {
      setZipError(tx('7桁の郵便番号を入力してください（例：150-0002）', 'Enter a 7-digit postal code (e.g. 150-0002)'));
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
        const addr = `${hit.address1}${hit.address2}${hit.address3}`;
        setArea(addr);
        setErrors((e) => ({ ...e, area: undefined }));
        // Geocode to coarse coordinates (rounded ~1km) so distance & the map
        // are real — never an exact address. Best-effort; failure is fine.
        void geocodeArea(addr).then((c) => c && setCoords(c));
      } else {
        setZipError(tx('該当する住所が見つかりませんでした', 'No address found for that postal code'));
      }
    } catch {
      setZipError(tx('検索に失敗しました。エリアを直接入力してください。', 'Lookup failed. Please type your area instead.'));
    } finally {
      setZipLoading(false);
    }
  };

  // OSM Nominatim geocode of the area name → coarse lat/lon (2 dp ≈ 1.1km).
  async function geocodeArea(q: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ja&countrycodes=jp&q=${encodeURIComponent(q)}`,
      );
      const arr = (await res.json()) as { lat: string; lon: string }[];
      const hit = arr[0];
      if (!hit) return null;
      return { lat: Math.round(parseFloat(hit.lat) * 100) / 100, lon: Math.round(parseFloat(hit.lon) * 100) / 100 };
    } catch {
      return null;
    }
  }

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
    if (firstName.trim().length < 2) next.firstName = tx('名前を入力してください', 'Please enter your name');
    if (area.trim().length < 2)
      next.area = tx(
        'おおまかなエリアを入力してください（正確な住所は不要です）',
        'Please enter your general area (no exact address needed)',
      );
    if (petStatus === 'has-other-pet' && otherPetType.trim().length === 0)
      next.otherPetType = tx('ペットの種類を入力してください', 'Please enter the type of pet');
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
      lat: coords?.lat,
      lon: coords?.lon,
      otherPetType: petStatus === 'has-other-pet' ? otherPetType.trim() : undefined,
    });
  };

  return (
    <>
      <View style={styles.photoRow}>
        <OwnerAvatar ownerId="owner-1" name={firstName || tx('あなた', 'You')} uri={photo} style={styles.avatar} rounded={radius.pill} size={48} />
        <Pressable onPress={changePhoto} style={styles.photoBtn} accessibilityRole="button" accessibilityLabel={tx('プロフィール写真を変更', 'Change profile photo')}>
          <Text style={styles.photoBtnText}>{photo ? tx('写真を変更', 'Change photo') : tx('写真を追加', 'Add photo')}</Text>
        </Pressable>
      </View>

      <Field label={tx('お名前 *', 'Name *')} value={firstName} onChangeText={setFirstName} placeholder={tx('例：あかり', 'e.g. Akari')} error={errors.firstName} />

      <View style={styles.zipRow}>
        <Field
          label={tx('郵便番号（日本）', 'Postal code (Japan)')}
          value={zip}
          onChangeText={setZip}
          placeholder={tx('例：150-0002', 'e.g. 150-0002')}
          maxLength={8}
          inputMode="numeric"
          error={zipError}
          containerStyle={{ flex: 1 }}
        />
        <Pressable
          onPress={lookupZip}
          disabled={zipLoading}
          accessibilityRole="button"
          accessibilityLabel={tx('郵便番号から住所を検索', 'Look up address from postal code')}
          accessibilityState={{ disabled: zipLoading }}
          style={[styles.zipBtn, zipLoading && { opacity: 0.6 }]}
        >
          <Text style={styles.zipBtnText}>{zipLoading ? tx('検索中…', 'Searching…') : tx('住所検索', 'Find address')}</Text>
        </Pressable>
      </View>

      <Field
        label={tx('おおまかなエリア *', 'General area *')}
        value={area}
        onChangeText={setArea}
        placeholder={tx('郵便番号から自動入力（編集もできます）', 'Auto-filled from postal code (editable)')}
        error={errors.area}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.groupLabel}>{tx('ペットについて', 'About your pets')}</Text>
        <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
          {PET_STATUS_OPTIONS.map((status) => {
            const selected = petStatus === status;
            const note = PET_STATUS_NOTE[status];
            return (
              <Pressable
                key={status}
                onPress={() => selectPetStatus(status)}
                accessibilityRole="radio"
                accessibilityLabel={tx(JP_PET_STATUS[status] ?? status, EN_PET_STATUS[status] ?? status)}
                accessibilityState={{ selected }}
                style={[styles.statusCard, selected && styles.statusCardOn]}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterOn]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusText, selected && styles.statusTextOn]}>
                    {tx(JP_PET_STATUS[status] ?? status, EN_PET_STATUS[status] ?? status)}
                  </Text>
                  {!!note && <Text style={styles.statusNote}>{tx(note[0], note[1])}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
        {petStatus === 'has-other-pet' && (
          <Field
            label={tx('ペットの種類 *', 'Type of pet *')}
            value={otherPetType}
            onChangeText={setOtherPetType}
            placeholder={tx('例：猫、うさぎ', 'e.g. cat, rabbit')}
            maxLength={30}
            error={errors.otherPetType}
          />
        )}
      </View>

      <Field label={tx('ひとこと自己紹介', 'Short intro')} value={bio} onChangeText={setBio} placeholder={tx('あなたのことや、どんなふうに会いたいかをひとこと', 'A little about you and how you like to meet up')} multiline numberOfLines={3} />

      <ChipGroup label={tx('年齢層（任意）', 'Age range (optional)')} options={AGE_RANGES} selected={ageRange ? [ageRange] : []} onToggle={(v) => setAgeRange((cur) => (cur === v ? undefined : v))} format={(v) => v} />

      <View style={{ gap: spacing.sm }}>
        <ChipGroup label={tx('話せる言語', 'Languages you speak')} options={languageOptions} selected={languages} onToggle={(v) => toggle(languages, setLanguages, v)} format={(v) => tv(JP_LANGUAGE, v)} />
        <View style={styles.customLangRow}>
          <TextInput
            value={customLanguage}
            onChangeText={setCustomLanguage}
            placeholder={tx('その他の言語を入力', 'Add another language')}
            placeholderTextColor={night.faint}
            maxLength={30}
            style={styles.customLangInput}
            accessibilityLabel={tx('その他の言語を入力', 'Add another language')}
            onSubmitEditing={addCustomLanguage}
            returnKeyType="done"
          />
          <Pressable
            onPress={addCustomLanguage}
            accessibilityRole="button"
            accessibilityLabel={tx('言語を追加', 'Add language')}
            style={styles.addLangBtn}
          >
            <Text style={styles.addLangBtnText}>{tx('追加', 'Add')}</Text>
          </Pressable>
        </View>
      </View>

      <ChipGroup label={tx('よく空いている時間帯', 'When you’re usually free')} options={AVAILABILITY} selected={availability} onToggle={(v) => toggle(availability, setAvailability, v)} format={(v) => tv(JP_AVAILABILITY, v)} />

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
