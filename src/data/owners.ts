/**
 * Rich owner-profile data for the demo owners.
 *
 * Dating-app trust is built from specifics: a voice-y bio, prompt answers
 * that invite a reply, social proof (tenure, events), and shared ground.
 * Copy is stored bilingually so profiles feel native in either UI language.
 */

export interface BiText {
  ja: string;
  en: string;
}

export interface OwnerPrompt {
  q: BiText;
  a: BiText;
}

export interface SeedOwnerProfile {
  ageRange: string;
  languages: string[]; // stored values match data/options.ts LANGUAGES
  availability: string[]; // stored values match data/options.ts AVAILABILITY
  memberSince: BiText;
  eventsJoined: number;
  bio: BiText;
  prompts: OwnerPrompt[];
}

export const SEED_OWNER_PROFILES: Record<string, SeedOwnerProfile> = {
  'owner-2': {
    // Priya · Luna (Border Collie)
    ageRange: '25-34',
    languages: ['English', 'French'],
    availability: ['Weekday mornings', 'Weekend mornings'],
    memberSince: { ja: '2025年9月から', en: 'Since Sep 2025' },
    eventsJoined: 9,
    bio: {
      ja: '朝6時のドッグランがわたしのコーヒー代わり。Lunaと一緒に走ってくれる元気なコンビを探しています。人見知りしないので、気軽に話しかけてください！',
      en: "The 6am dog park is my coffee. Looking for an energetic duo to run with Luna — I'm easy to talk to, so just say hi!",
    },
    prompts: [
      {
        q: { ja: '愛犬との理想の休日は？', en: 'My perfect day with my dog…' },
        a: {
          ja: '早朝の河川敷ラン→カフェのテラス席→昼寝。この順番は譲れません。',
          en: 'Riverside run at dawn → café terrace → nap. In that exact order.',
        },
      },
      {
        q: { ja: '初対面の人に自慢したいこと', en: 'A brag I have ready to go' },
        a: {
          ja: 'Lunaはフリスビーを空中で3回連続キャッチできます。動画もあります。',
          en: 'Luna can catch a frisbee three times in a row mid-air. I have footage.',
        },
      },
    ],
  },
  'owner-3': {
    // Marcus · Cooper (Golden Retriever)
    ageRange: '35-44',
    languages: ['English', 'German'],
    availability: ['Weekday evenings', 'Weekend afternoons'],
    memberSince: { ja: '2025年11月から', en: 'Since Nov 2025' },
    eventsJoined: 5,
    bio: {
      ja: '在宅エンジニア。夕方の散歩が1日のリセットボタンです。Cooperはだれとでも仲良くなれるので、飼い主同士ものんびり話せたらうれしいです。',
      en: "Remote engineer — the evening walk is my daily reset button. Cooper befriends everyone, so I'm hoping the humans can chat at the same easy pace.",
    },
    prompts: [
      {
        q: { ja: '愛犬のいちばん変なクセ', en: "My dog's weirdest habit" },
        a: {
          ja: '水たまりを見つけると必ず座ります。雨の日の散歩は覚悟が要ります。',
          en: 'He sits in every puddle he finds. Rainy walks require commitment.',
        },
      },
      {
        q: { ja: '会ったら聞いてほしいこと', en: 'Ask me about…' },
        a: {
          ja: 'Cooperが結婚式のリングドッグを務めた話。3回失敗して4回目で成功しました。',
          en: 'The time Cooper was a wedding ring-bearer. Three failed attempts, nailed the fourth.',
        },
      },
    ],
  },
  'owner-4': {
    // Sofia · Mochi (Shiba Inu)
    ageRange: '25-34',
    languages: ['English', 'Spanish'],
    availability: ['Weekend mornings', 'Weekend afternoons'],
    memberSince: { ja: '2026年1月から', en: 'Since Jan 2026' },
    eventsJoined: 3,
    bio: {
      ja: 'イラストレーター。Mochiは慎重派なので、落ち着いたワンちゃんとゆっくり仲良くなれたら。散歩のあとのカフェ開拓が趣味です。',
      en: "Illustrator. Mochi warms up slowly, so a calm pup and a patient owner are the dream. I collect café discoveries after every walk.",
    },
    prompts: [
      {
        q: { ja: '愛犬を一言で表すと？', en: 'My dog in one sentence' },
        a: {
          ja: '「猫になりたかった犬」。でも心を許した相手にはとことん甘えます。',
          en: 'A dog who wanted to be a cat — but once she trusts you, she\'s all yours.',
        },
      },
      {
        q: { ja: '週末の定番コース', en: 'My weekend ritual' },
        a: {
          ja: '朝の公園→スケッチ30分→Mochiと日向ぼっこ。誰かと共有できたら最高。',
          en: 'Morning park → 30 minutes of sketching → sunbathing with Mochi. Better shared.',
        },
      },
    ],
  },
  'owner-5': {
    // Ahmed · Bruno
    ageRange: '35-44',
    languages: ['English', 'Arabic'],
    availability: ['Weekday evenings'],
    memberSince: { ja: '2025年10月から', en: 'Since Oct 2025' },
    eventsJoined: 11,
    bio: {
      ja: '週2でグループ散歩を主催しています。大型犬の飼い主仲間が増えるとうれしい。安全第一、おやつは多めに持ち歩くタイプです。',
      en: "I host a group walk twice a week — always happy to meet more big-dog people. Safety first, treats always overstocked.",
    },
    prompts: [
      {
        q: { ja: 'ドッグラン での必需品', en: 'My dog-park essential' },
        a: {
          ja: '予備のリードと業務用サイズのおやつ袋。みんなの分もあります。',
          en: 'A spare leash and a wholesale-size treat bag. Enough for everyone\'s dogs.',
        },
      },
      {
        q: { ja: '理想のミートアップ', en: 'My ideal meetup' },
        a: {
          ja: '5〜6頭でゆるく歩いて、最後は犬OKのテラスで乾杯。',
          en: 'Five or six dogs, one easy loop, then a dog-friendly terrace to finish.',
        },
      },
    ],
  },
  'owner-6': {
    // Elena · Daisy
    ageRange: '45-54',
    languages: ['English', 'Spanish'],
    availability: ['Weekday mornings', 'Weekend mornings'],
    memberSince: { ja: '2025年8月から', en: 'Since Aug 2025' },
    eventsJoined: 14,
    bio: {
      ja: 'シニア犬の保護活動をしています。Daisyはおっとり系。ゆっくり歩ける方、ベンチでおしゃべりしたい方、ぜひ。',
      en: "I volunteer with senior-dog rescue. Daisy is a gentle soul — slow walkers and bench-chatters, you're my people.",
    },
    prompts: [
      {
        q: { ja: '犬から教わったこと', en: 'Something my dog taught me' },
        a: {
          ja: '急がないこと。においを嗅ぐ時間も散歩のうち。',
          en: "Not to rush. Sniffing time is walking time.",
        },
      },
      {
        q: { ja: '休日の過ごし方', en: 'How I spend my weekends' },
        a: {
          ja: '朝市→公園→Daisyと縁側で読書。地味だけど最高です。',
          en: 'Morning market → park → reading on the porch with Daisy. Quiet and perfect.',
        },
      },
    ],
  },
  'owner-7': {
    // Jordan · Rocky
    ageRange: '25-34',
    languages: ['English'],
    availability: ['Weekday evenings', 'Weekend afternoons'],
    memberSince: { ja: '2026年2月から', en: 'Since Feb 2026' },
    eventsJoined: 2,
    bio: {
      ja: 'Rockyはまだ1歳のやんちゃ盛り。しつけ教室に通いながら、遊び相手と飼い主の先輩を探しています。アドバイス歓迎！',
      en: "Rocky is one year of pure chaos. We're in training classes and looking for playmates — and for owner-senpais with advice!",
    },
    prompts: [
      {
        q: { ja: 'いま練習していること', en: "What we're working on" },
        a: {
          ja: '「おいで」の成功率を50%から80%へ。おやつの力を借りつつ。',
          en: 'Getting recall from 50% to 80%. Treats are doing the heavy lifting.',
        },
      },
      {
        q: { ja: '正直に白状します', en: 'An honest confession' },
        a: {
          ja: 'ソファはもうRockyのものです。私は端っこで寝ています。',
          en: 'The couch belongs to Rocky now. I sleep on the edge.',
        },
      },
    ],
  },
  'owner-8': {
    // Grace · Nala
    ageRange: '25-34',
    languages: ['English', 'Mandarin'],
    availability: ['Weekend mornings'],
    memberSince: { ja: '2025年12月から', en: 'Since Dec 2025' },
    eventsJoined: 6,
    bio: {
      ja: '看護師なのでシフト不定期ですが、日曜の朝だけは必ずNalaの時間。同じく朝型の飼い主さんと定例散歩ができたら理想です。',
      en: "Nurse with a chaotic shift pattern, but Sunday mornings are sacred Nala time. A standing walk with another early bird would be ideal.",
    },
    prompts: [
      {
        q: { ja: '愛犬の特技', en: "My dog's party trick" },
        a: {
          ja: '私の夜勤明けを玄関で察知して、リードを咥えて待っています。',
          en: 'She senses my night shift ending and waits at the door, leash in mouth.',
        },
      },
      {
        q: { ja: '一緒にしたいこと', en: "Let's do this together" },
        a: {
          ja: '日曜朝のベーカリー巡り散歩。犬OKの店リスト、共同で育てませんか。',
          en: 'Sunday-morning bakery walks. Co-own a dog-friendly shop list with me?',
        },
      },
    ],
  },
  'owner-9': {
    // Liam · Pepper
    ageRange: '18-24',
    languages: ['English', 'French'],
    availability: ['Weekday evenings', 'Weekend afternoons'],
    memberSince: { ja: '2026年3月から', en: 'Since Mar 2026' },
    eventsJoined: 4,
    bio: {
      ja: '大学院生。Pepperは小さいけど態度は大きめ。夕方にキャンパス周辺を歩いています。試験期間中は癒し要員を募集します。',
      en: "Grad student. Pepper is small with a big attitude. We do evening campus loops — emotional-support playdates welcome during finals.",
    },
    prompts: [
      {
        q: { ja: '犬とのルーティン', en: 'Our daily ritual' },
        a: {
          ja: '論文を1章読むごとにボール投げ10回。Pepperが監督です。',
          en: 'Ten fetch throws per thesis chapter. Pepper enforces the schedule.',
        },
      },
      {
        q: { ja: '好きな場所', en: 'Our favourite spot' },
        a: {
          ja: '図書館裏の芝生。午後4時の日当たりが完璧です。',
          en: 'The lawn behind the library. The 4pm sun there is undefeated.',
        },
      },
    ],
  },
  'owner-10': {
    // Hana · Max
    ageRange: '25-34',
    languages: ['English'],
    availability: ['Weekday mornings', 'Weekday evenings'],
    memberSince: { ja: '2025年9月から', en: 'Since Sep 2025' },
    eventsJoined: 8,
    bio: {
      ja: 'パン屋の早朝シフト勤務。Maxとは開店前の静かな街を散歩しています。売れ残りのパンを持参することがあります（人間用）。',
      en: "Early-shift baker. Max and I walk the quiet streets before opening. I sometimes bring day-old pastries (for the humans).",
    },
    prompts: [
      {
        q: { ja: 'うちの犬の起こし方', en: 'How my dog wakes me up' },
        a: {
          ja: '起こしてくれません。私が4時に起きるので、迷惑そうな顔をされます。',
          en: "He doesn't. I get up at 4am and he looks personally offended.",
        },
      },
      {
        q: { ja: '自慢のスポット', en: 'A spot I gatekeep (until now)' },
        a: {
          ja: '夜明けの橋の上。街がいちばん静かで、Maxがいちばん凛々しい時間。',
          en: 'The bridge at dawn — the city at its quietest, Max at his noblest.',
        },
      },
    ],
  },
  'owner-11': {
    // Tom · Bella
    ageRange: '55+',
    languages: ['English'],
    availability: ['Weekday mornings', 'Weekend mornings'],
    memberSince: { ja: '2025年8月から', en: 'Since Aug 2025' },
    eventsJoined: 12,
    bio: {
      ja: '定年後、Bellaと歩くことが日課になりました。毎朝同じ公園にいます。犬の話なら何時間でもできます。お茶でもどうぞ。',
      en: "Retired, and Bella turned my mornings into a ritual. Same park, every day. I can talk dogs for hours — tea's on me.",
    },
    prompts: [
      {
        q: { ja: '長年の犬飼いとしての持論', en: 'My veteran dog-owner take' },
        a: {
          ja: '犬は飼い主の歩く速さになる。だから私はゆっくり歩きます。',
          en: "Dogs walk at their owner's pace. That's why I walk slowly.",
        },
      },
      {
        q: { ja: '朝のたのしみ', en: 'The best part of my morning' },
        a: {
          ja: 'Bellaが公園の入り口で必ず一回だけ跳ねること。毎日です。',
          en: 'Bella does exactly one happy hop at the park gate. Every single day.',
        },
      },
    ],
  },
  'owner-12': {
    // Noah · Zeus
    ageRange: '35-44',
    languages: ['English', 'German'],
    availability: ['Weekend afternoons'],
    memberSince: { ja: '2025年10月から', en: 'Since Oct 2025' },
    eventsJoined: 7,
    bio: {
      ja: '消防士。Zeusは小さいのに態度は大型犬なミニチュアダックス。短い脚に大きなハート。ご近所さんぽとソファ仲間を募集中。',
      en: "Firefighter. Zeus is a dachshund with the confidence of a Great Dane — short legs, huge heart. After neighbourhood strolls and sofa buddies.",
    },
    prompts: [
      {
        q: { ja: 'ギャップ自慢', en: 'The gap that gets everyone' },
        a: {
          ja: '9kgのZeusは雷が鳴ると私の膝に乗ろうとします。',
          en: 'All 9kg of Zeus tries to climb into my lap when it thunders.',
        },
      },
      {
        q: { ja: '次に行きたい場所', en: 'Next on our list' },
        a: {
          ja: '犬OKの下町カフェ巡り。下見済み。あとは仲間だけ。',
          en: 'A dog-friendly café crawl through the old town. Scouted. Just need company.',
        },
      },
    ],
  },
  'owner-13': {
    // Maya · Ollie
    ageRange: '18-24',
    languages: ['English', 'Spanish'],
    availability: ['Weekday evenings', 'Weekend mornings'],
    memberSince: { ja: '2026年1月から', en: 'Since Jan 2026' },
    eventsJoined: 5,
    bio: {
      ja: 'カメラが趣味で、Ollieは専属モデル。お散歩ついでに愛犬の写真、撮ります。データはその場でお渡しします📷',
      en: "Hobby photographer; Ollie is my full-time model. I'll happily shoot your dog on our walk — photos delivered on the spot 📷",
    },
    prompts: [
      {
        q: { ja: '私の隠れた特技', en: 'My hidden talent' },
        a: {
          ja: 'どんな犬でも3分でカメラ目線にできます。成功率98%。',
          en: 'I can get any dog to look at the camera in 3 minutes. 98% success rate.',
        },
      },
      {
        q: { ja: '最近うれしかったこと', en: 'A recent small joy' },
        a: {
          ja: 'Ollieの写真が動物病院の待合室に飾られました。親バカです。',
          en: "Ollie's photo now hangs in the vet's waiting room. Yes, I'm that proud.",
        },
      },
    ],
  },
};
