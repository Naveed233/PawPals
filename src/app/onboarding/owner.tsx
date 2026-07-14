import { useRouter } from 'expo-router';
import { useState } from 'react';

import { OwnerForm } from '@/components/OwnerForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';
import type { PetStatus } from '@/types';

export default function OwnerOnboarding() {
  const router = useRouter();
  const setOwner = useStore((s) => s.setOwner);
  // Only the has-dog path continues to the pet profile (step 2).
  const [petStatus, setPetStatus] = useState<PetStatus>('has-dog');

  return (
    <Screen
      title="あなたについて"
      subtitle={petStatus === 'has-dog' ? 'ステップ1/2・飼い主プロフィール' : 'ステップ1・飼い主プロフィール'}
    >
      <OwnerForm
        submitLabel="次へ"
        onPetStatusChange={setPetStatus}
        onSubmit={(v) => {
          setOwner({ id: 'owner-1', verified: false, ...v });
          if (v.petStatus === 'has-dog') {
            router.push('/onboarding/dog');
          } else {
            router.replace('/');
          }
        }}
      />
    </Screen>
  );
}
