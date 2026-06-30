import { useRouter } from 'expo-router';

import { OwnerForm } from '@/components/OwnerForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';

export default function OwnerOnboarding() {
  const router = useRouter();
  const setOwner = useStore((s) => s.setOwner);

  return (
    <Screen title="About you" subtitle="Step 1 of 2 · Owner profile">
      <OwnerForm
        submitLabel="Continue"
        onSubmit={(v) => {
          setOwner({ id: 'owner-1', verified: false, ...v });
          router.push('/onboarding/dog');
        }}
      />
    </Screen>
  );
}
