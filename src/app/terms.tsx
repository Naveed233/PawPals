import { useSafeBack } from '@/lib/nav';

import { Screen } from '@/components/Screen';
import { useI18n } from '@/lib/i18n';
import { StyleSheet, Text, View } from 'react-native';
import { font, night, spacing } from '@/theme';

/**
 * Terms of Service — publicly reachable at /terms. Required for the App Store
 * listing (alongside the privacy policy) and linked from Profile. Bilingual.
 * Update the effective date / contact before store submission.
 */
const EFFECTIVE = '2026-07-22';
const CONTACT = 'naweed23@gmail.com';
const MIN_AGE = 17;

export default function Terms() {
  const goBack = useSafeBack('/(tabs)/profile');
  const { tx } = useI18n();

  const sections: { h: string; b: string }[] = [
    {
      h: tx('利用規約への同意', 'Agreement to these terms'),
      b: tx(
        'PawPairを利用することで、本規約に同意したものとみなされます。同意いただけない場合は、本サービスをご利用いただけません。',
        'By using PawPair you agree to these terms. If you do not agree, please do not use the service.',
      ),
    },
    {
      h: tx(`年齢制限（${MIN_AGE}歳以上）`, `Age requirement (${MIN_AGE}+)`),
      b: tx(
        `本サービスのご利用は${MIN_AGE}歳以上の方に限ります。アカウントを作成することで、${MIN_AGE}歳以上であることを表明・保証するものとします。${MIN_AGE}歳未満の方によるアカウントは、確認次第削除します。`,
        `You must be ${MIN_AGE} or older to use PawPair. By creating an account you represent that you meet this requirement. Accounts belonging to anyone under ${MIN_AGE} will be removed when identified.`,
      ),
    },
    {
      h: tx('PawPairの目的', 'What PawPair is for'),
      b: tx(
        'PawPairは、犬の友だち作り・お散歩仲間・ミートアップのためのプラットフォームです。人間向けの恋愛・出会い系サービスではありません。',
        'PawPair is a platform for dog friendships, walking buddies and meetups. It is not a dating service for humans.',
      ),
    },
    {
      h: tx('コミュニティのルール', 'Community rules'),
      b: tx(
        '嫌がらせ、なりすまし、わいせつ・暴力的な内容、スパム、商業目的の勧誘、他人の写真の無断使用は禁止です。動物福祉に反する行為（違法な繁殖・販売・虐待）も固く禁じます。違反した場合、予告なくアカウントを停止することがあります。',
        'No harassment, impersonation, sexual or violent content, spam, or commercial solicitation. Do not upload photos you do not own. Anything that harms animal welfare (illegal breeding, sales, cruelty) is strictly prohibited. Violations may result in suspension without notice.',
      ),
    },
    {
      h: tx('あなたのコンテンツ', 'Your content'),
      b: tx(
        '投稿した写真やプロフィール情報の権利はあなたに帰属します。サービス提供のために必要な範囲で表示・保存する許諾を当社に付与するものとします。アカウント削除時にコンテンツも削除されます。',
        'You keep ownership of the photos and profile information you post. You grant us permission to store and display them only as needed to run the service. Your content is deleted when you delete your account.',
      ),
    },
    {
      h: tx('ミートアップと自己責任', 'Meetups are at your own risk'),
      b: tx(
        '実際に会う際の安全確認はご自身の責任で行ってください。当社はユーザーの身元確認や審査を保証しません。必ず犬同伴OKの公共の場所を選び、愛犬から目を離さないでください。ミートアップ中に生じた事故・損害について、当社は責任を負いません。',
        'You are responsible for your own safety when meeting people in person. We do not vet or background-check users. Always meet in public, dog-friendly places and supervise your dog. We are not liable for anything that happens during a meetup.',
      ),
    },
    {
      h: tx('アカウントの停止・削除', 'Suspension & termination'),
      b: tx(
        '本規約に違反した場合、アカウントを停止または削除することがあります。ご自身でも、プロフィールタブの「アカウントを削除」からいつでも削除できます。',
        'We may suspend or remove accounts that break these terms. You can delete your own account at any time from Profile → Delete account.',
      ),
    },
    {
      h: tx('免責事項', 'No warranty'),
      b: tx(
        '本サービスは「現状有姿」で提供されます。中断なく利用できること、内容が正確であることを保証するものではありません。法律で認められる範囲において、当社の責任は限定されます。',
        'The service is provided "as is". We do not guarantee it will be uninterrupted or error-free. To the extent permitted by law, our liability is limited.',
      ),
    },
    {
      h: tx('規約の変更', 'Changes to these terms'),
      b: tx(
        '本規約は変更されることがあります。重要な変更がある場合はアプリ内でお知らせします。変更後も利用を継続された場合、変更に同意したものとみなされます。',
        'We may update these terms. We will note significant changes in the app. Continuing to use PawPair after a change means you accept it.',
      ),
    },
    {
      h: tx('お問い合わせ', 'Contact'),
      b: `${CONTACT}`,
    },
  ];

  return (
    <Screen title={tx('利用規約', 'Terms of Service')} onBack={() => goBack()}>
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
