import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PremiumBadge } from '@/components/PremiumBadge';
import { Screen } from '@/components/Screen';
import { Button, Chip, Field } from '@/components/ui';
import { ENERGY_LEVELS, SEXES, SIZES } from '@/data/options';
import { useI18n } from '@/lib/i18n';
import {
  EN_GOOD_WITH,
  JP_ENERGY,
  JP_GOOD_WITH,
  JP_SEX,
  JP_SIZE,
} from '@/lib/jp';
import { useStore } from '@/store';
import { EMPTY_FILTERS, type DiscoveryFilters } from '@/types';
import { font, night, spacing } from '@/theme';

const DISTANCES = [1, 3, 5, 10, 25];
const GOOD_WITH_KEYS = Object.keys(JP_GOOD_WITH);

export default function Filters() {
  const router = useRouter();
  const { tx, tv } = useI18n();
  const stored = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);

  const [f, setF] = useState<DiscoveryFilters>(stored);

  // Deep-linking straight here leaves no back stack — fall back to discovery.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const apply = () => {
    setFilters(f);
    goBack();
  };
  const clear = () => setF({ ...EMPTY_FILTERS });

  return (
    <Screen
      title={tx('絞り込み', 'Filters')}
      onBack={goBack}
      right={
        <Text style={styles.clear} accessibilityRole="button" onPress={clear}>
          {tx('クリア', 'Clear')}
        </Text>
      }
    >
      <Text style={styles.intro}>
        {tx(
          'ぴったりの遊び相手を見つけよう。すべての条件は今は無料でお使いいただけます。',
          'Dial in the perfect playmate. Every filter is free to use right now.',
        )}
      </Text>

      <Group label={tx('サイズ', 'Size')}>
        {SIZES.map((s) => (
          <Chip key={s} label={tv(JP_SIZE, s)} selected={f.sizes.includes(s)} onPress={() => setF({ ...f, sizes: toggle(f.sizes, s) })} />
        ))}
      </Group>

      <Group label={tx('エネルギー', 'Energy')}>
        {ENERGY_LEVELS.map((e) => (
          <Chip key={e} label={tv(JP_ENERGY, e)} selected={f.energies.includes(e)} onPress={() => setF({ ...f, energies: toggle(f.energies, e) })} />
        ))}
      </Group>

      <Group label={tx('性別', 'Sex')}>
        {SEXES.map((s) => (
          <Chip key={s} label={tv(JP_SEX, s)} selected={f.sexes.includes(s)} onPress={() => setF({ ...f, sexes: toggle(f.sexes, s) })} />
        ))}
      </Group>

      <Group label={tx('距離', 'Distance')} premium>
        {DISTANCES.map((d) => (
          <Chip
            key={d}
            label={tx(`${d}km以内`, `Within ${d}km`)}
            selected={f.maxDistanceKm === d}
            onPress={() => setF({ ...f, maxDistanceKm: f.maxDistanceKm === d ? null : d })}
          />
        ))}
      </Group>

      <Group label={tx('一緒に遊べる相手', 'Good with')} premium>
        {GOOD_WITH_KEYS.map((k) => (
          <Chip
            key={k}
            label={tx(JP_GOOD_WITH[k], EN_GOOD_WITH[k] ?? k)}
            selected={f.goodWith.includes(k)}
            onPress={() => setF({ ...f, goodWith: toggle(f.goodWith, k) })}
          />
        ))}
      </Group>

      <Group label={tx('健康', 'Health')} premium>
        <Chip label={tx('ワクチン接種済み', 'Vaccinated')} selected={f.vaccinatedOnly} onPress={() => setF({ ...f, vaccinatedOnly: !f.vaccinatedOnly })} />
        <Chip label={tx('去勢・避妊済み', 'Neutered')} selected={f.neuteredOnly} onPress={() => setF({ ...f, neuteredOnly: !f.neuteredOnly })} />
      </Group>

      <View style={styles.breedWrap}>
        <View style={styles.groupHead}>
          <Text style={styles.groupLabel}>{tx('犬種', 'Breed')}</Text>
          <PremiumBadge />
        </View>
        <Field
          label=""
          value={f.breed}
          onChangeText={(breed) => setF({ ...f, breed })}
          placeholder={tx('例：柴犬、レトリバー', 'e.g. Shiba, Retriever')}
          maxLength={40}
        />
      </View>

      <Button label={tx('この条件で表示', 'Show matches')} onPress={apply} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}

function Group({ label, premium, children }: { label: string; premium?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.groupHead}>
        <Text style={styles.groupLabel}>{label}</Text>
        {premium && <PremiumBadge />}
      </View>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: night.muted, fontSize: font.small, lineHeight: 20 },
  clear: { color: night.pink, fontSize: font.small, fontWeight: '800' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupLabel: { color: night.text, fontSize: font.body, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  breedWrap: { gap: spacing.sm },
});
