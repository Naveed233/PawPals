import { useRouter } from 'expo-router';

import { OwnerForm } from '@/components/OwnerForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';

export default function EditOwner() {
  const router = useRouter();
  const owner = useStore((s) => s.owner);
  const updateOwner = useStore((s) => s.updateOwner);

  if (!owner) return null;

  return (
    <Screen title="Edit your profile" onBack={() => router.back()}>
      <OwnerForm
        initial={owner}
        submitLabel="Save changes"
        onSubmit={(v) => {
          updateOwner(v);
          router.back();
        }}
      />
    </Screen>
  );
}
