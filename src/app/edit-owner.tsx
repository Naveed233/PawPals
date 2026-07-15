import { useRouter } from 'expo-router';

import { OwnerForm } from '@/components/OwnerForm';
import { Screen } from '@/components/Screen';
import { useI18n } from '@/lib/i18n';
import { saveProfileRemote } from '@/lib/sync';
import { useStore } from '@/store';

export default function EditOwner() {
  const router = useRouter();
  const { tx } = useI18n();
  const owner = useStore((s) => s.owner);
  const setOwner = useStore((s) => s.setOwner);

  if (!owner) return null;

  return (
    <Screen title={tx('プロフィールを編集', 'Edit profile')} onBack={() => router.back()}>
      <OwnerForm
        initial={owner}
        submitLabel={tx('変更を保存', 'Save changes')}
        onSubmit={(v) => {
          // Spread over the full profile so new form fields (petStatus,
          // otherPetType, custom languages) persist alongside id/verified.
          const next = { ...owner, ...v };
          setOwner(next);
          void saveProfileRemote(next);
          router.back();
        }}
      />
    </Screen>
  );
}
