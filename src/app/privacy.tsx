import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useI18n } from '@/lib/i18n';
import { StyleSheet, Text, View } from 'react-native';
import { font, night, spacing } from '@/theme';

/**
 * Privacy policy — publicly reachable at /privacy (required for the App Store
 * listing and by Apple/Google sign-in). Bilingual; renders in the current UI
 * language. Update the contact email / effective date before store submission.
 */
const EFFECTIVE = '2026-07-17';
const CONTACT = 'naweed23@gmail.com';

export default function Privacy() {
  const router = useRouter();
  const { tx } = useI18n();

  const sections: { h: string; b: string }[] = [
    {
      h: tx('収集する情報', 'Information we collect'),
      b: tx(
        'アカウント作成時のメールアドレス、プロフィール情報（お名前、エリア、自己紹介、言語、ペット情報）、アップロードした写真、およびアプリの利用データ（スワイプ、マッチ、メッセージ）を収集します。地図機能を使う場合は、おおよその位置情報（正確な住所は保存しません）を利用します。',
        'We collect your email address at sign-up, your profile information (name, general area, bio, languages, pet details), photos you upload, and app activity (swipes, matches, messages). If you use the map, we use an approximate location — we never store your exact address.',
      ),
    },
    {
      h: tx('情報の使い方', 'How we use it'),
      b: tx(
        'ご近所のワンちゃんや飼い主さんとのマッチング、メッセージ機能、安全なコミュニティの維持のために利用します。広告目的で個人情報を第三者に販売することはありません。',
        'To match you with nearby dogs and owners, power messaging, and keep the community safe. We do not sell your personal information to third parties for advertising.',
      ),
    },
    {
      h: tx('情報の保存と共有', 'Storage & sharing'),
      b: tx(
        'データは Supabase（安全なクラウドインフラ）に保存されます。プロフィールはマッチした相手にのみ表示され、マッチ前は他のユーザーに公開されません。認証には Google・Apple のサインインを利用できます。',
        'Data is stored with Supabase (secure cloud infrastructure). Your profile is visible only to people you have matched with — never to others before a match. You may sign in with Google or Apple.',
      ),
    },
    {
      h: tx('安全とモデレーション', 'Safety & moderation'),
      b: tx(
        '不適切なユーザーはブロック・通報できます。通報内容はモデレーションのために保存されます。実際に会うときは、犬同伴OKの公共の場所を選んでください。',
        'You can block and report other users; reports are stored for moderation. When meeting in person, always choose a public, dog-friendly place.',
      ),
    },
    {
      h: tx('あなたの権利', 'Your rights'),
      b: tx(
        'プロフィールタブの「アカウントを削除」から、いつでもアカウントとすべてのデータを完全に削除できます。データに関するお問い合わせは下記までご連絡ください。',
        'You can permanently delete your account and all data at any time from Profile → Delete account. For any data request, contact us below.',
      ),
    },
    {
      h: tx('お問い合わせ', 'Contact'),
      b: `${CONTACT}`,
    },
  ];

  return (
    <Screen title={tx('プライバシーポリシー', 'Privacy Policy')} onBack={() => router.back()}>
      <Text style={styles.effective}>
        {tx(`最終更新日：${EFFECTIVE}`, `Last updated: ${EFFECTIVE}`)}
      </Text>
      {sections.map((s) => (
        <View key={s.h} style={styles.section}>
          <Text style={styles.h}>{s.h}</Text>
          <Text style={styles.b}>{s.b}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  effective: { color: night.faint, fontSize: font.small, marginBottom: spacing.sm },
  section: { gap: spacing.xs },
  h: { color: night.text, fontSize: font.heading, fontWeight: '800' },
  b: { color: night.muted, fontSize: font.body, lineHeight: 23 },
});
