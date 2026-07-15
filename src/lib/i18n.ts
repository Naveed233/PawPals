import { useStore } from '@/store';

/**
 * Bilingual UI (Japanese default / English).
 *
 * Usage in components:
 *   const { lang, tx, tv } = useI18n();
 *   <Text>{tx('おかえりなさい！', 'Welcome back!')}</Text>
 *   <Text>{tv(JP_SEX, dog.sex)}</Text>   // enum: JP label or raw stored English
 *
 * `tx` keeps both languages next to each other at the call site — no central
 * dictionary to drift out of sync. `tv` translates stored enum values using
 * the JP_* maps from lib/jp.ts (in English mode the stored value IS English).
 */

export type Lang = 'ja' | 'en';

export function useI18n() {
  const lang = useStore((s) => s.language ?? 'ja');
  const tx = (ja: string, en: string) => (lang === 'ja' ? ja : en);
  const tv = (map: Record<string, string>, value: string) =>
    lang === 'ja' ? (map[value] ?? value) : value;
  return { lang, tx, tv };
}

/** Non-hook variant for helpers that receive the language as a parameter. */
export const txFor = (lang: Lang) => (ja: string, en: string) => (lang === 'ja' ? ja : en);
