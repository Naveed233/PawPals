import { useRouter } from 'expo-router';

import { OwnerForm } from '@/components/OwnerForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';

export default function EditOwner() {
  const router = useRouter();
  const owner = useStore((s) => s.owner);
  const setOwner = useStore((s) => s.setOwner);

  if (!owner) return null;

  return (
    <Screen title="プロフィールを編集" onBack={() => router.back()}>
      <OwnerForm
        initial={owner}
        submitLabel="変更を保存"
        onSubmit={(v) => {
          // Spread over the full profile so new form fields (petStatus,
          // otherPetType, custom languages) persist alongside id/verified.
          setOwner({ ...owner, ...v });
          router.back();
        }}
      />
    </Screen>
  );
}
