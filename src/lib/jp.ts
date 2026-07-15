/**
 * Japanese display labels for stored enum/tag values.
 *
 * Stored values stay English (they're typed enums referenced by seed data and
 * the compatibility engine) — screens translate at render time with jp().
 */

export const JP_SEX: Record<string, string> = { male: 'オス', female: 'メス' };

export const JP_SIZE: Record<string, string> = { small: '小型', medium: '中型', large: '大型' };

export const JP_ENERGY: Record<string, string> = { low: '低め', moderate: 'ふつう', high: '高め' };

export const JP_SOCIAL: Record<string, string> = {
  shy: 'シャイ',
  selective: '選り好み',
  social: '社交的',
  'very social': 'とても社交的',
};

export const JP_RECALL: Record<string, string> = {
  reliable: '呼び戻し◎',
  improving: '練習中',
  'on-leash only': 'リード必須',
};

export const JP_INTENT: Record<string, string> = {
  'Dog playdates': 'プレイデート',
  'Walking buddies': '散歩仲間',
  'Meetups & hangouts': 'ミートアップ',
  'Group events': 'グループイベント',
  'Owner dating': '飼い主デート',
};

export const JP_MEETUP: Record<string, string> = {
  'Short introduction': '短いご挨拶',
  'Leash walk': 'リード散歩',
  'Dog park visit': 'ドッグラン',
  'One-on-one playdate': '1対1のプレイデート',
  'Group walk': 'グループ散歩',
  'Puppy socialisation': '子犬の社会化',
  'Senior dog meetup': 'シニア犬の集い',
  'Café meetup': 'カフェで会う',
};

export const JP_LANGUAGE: Record<string, string> = {
  English: '英語',
  Spanish: 'スペイン語',
  French: 'フランス語',
  German: 'ドイツ語',
  Mandarin: '中国語',
  Arabic: 'アラビア語',
  Urdu: 'ウルドゥー語',
};

export const JP_AVAILABILITY: Record<string, string> = {
  'Weekday mornings': '平日の朝',
  'Weekday evenings': '平日の夜',
  'Weekend mornings': '週末の朝',
  'Weekend afternoons': '週末の午後',
};

export const JP_PERSONALITY: Record<string, string> = {
  Playful: '遊び好き',
  Calm: 'おだやか',
  Shy: 'シャイ',
  Confident: '自信家',
  Energetic: '元気いっぱい',
  Gentle: 'やさしい',
  Curious: '好奇心旺盛',
  Independent: 'マイペース',
  Social: '社交的',
  Selective: '選り好み',
  'Puppy-friendly': '子犬OK',
  'Senior-friendly': 'シニアOK',
};

export const JP_PLAY_STYLE: Record<string, string> = {
  Chasing: '追いかけっこ',
  Wrestling: 'プロレスごっこ',
  'Gentle play': 'やさしい遊び',
  'Parallel walking': '並んで散歩',
  Fetch: 'ボール遊び',
  Sniffing: 'においチェック',
  'Short introductions': '短いご挨拶',
  'One-on-one play': '1対1の遊び',
  'Group play': 'グループ遊び',
};

export const JP_ACTIVITY: Record<string, string> = {
  'Morning walks': '朝の散歩',
  'Park visits': '公園',
  'Beach trips': 'ビーチ',
  Hiking: 'ハイキング',
  'Café hangouts': 'カフェ',
  'Training sessions': 'トレーニング',
  'Backyard play': '庭遊び',
};

export const JP_GOOD_WITH: Record<string, string> = {
  smallDogs: '小型犬',
  largeDogs: '大型犬',
  puppies: '子犬',
  seniors: 'シニア犬',
  children: '子ども',
};

// GoodWith keys are camelCase slugs, so English needs its own labels too.
export const EN_GOOD_WITH: Record<string, string> = {
  smallDogs: 'small dogs',
  largeDogs: 'large dogs',
  puppies: 'puppies',
  seniors: 'senior dogs',
  children: 'children',
};

export const JP_PET_STATUS: Record<string, string> = {
  'has-dog': '犬を飼っている',
  'has-other-pet': 'ほかのペットを飼っている',
  'no-pet-meet': '犬を飼っている人と出会いたい',
  'no-pet-future': '将来、犬を飼いたい',
};

// Pet status is stored as slugs (not readable English like the other enums),
// so English mode needs its own label map instead of the raw stored value.
export const EN_PET_STATUS: Record<string, string> = {
  'has-dog': 'I have a dog',
  'has-other-pet': 'I have another pet',
  'no-pet-meet': 'I want to meet dog owners',
  'no-pet-future': 'I want a dog someday',
};

/** Translate a stored value; falls back to the raw value (e.g. user input). */
export function jp(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}
