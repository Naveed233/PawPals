import { useRouter } from 'expo-router';
import { useState } from 'react';

import { OwnerForm } from '@/components/OwnerForm';
import { Screen } from '@/components/Screen';
import { useI18n } from '@/lib/i18n';
import { saveProfileRemote } from '@/lib/sync';
import { useStore } from '@/store';
import type { PetStatus } from '@/types';

export default function OwnerOnboarding() {
  const router = useRouter();
  const { tx } = useI18n();
  const setOwner = useStore((s) => s.setOwner);
  // Only the has-dog path continues to the pet profile (step 2).
  const [petStatus, setPetStatus] = useState<PetStatus>('has-dog');

  return (
    <Screen
      title={tx('あなたについて', 'About you')}
      subtitle={
        petStatus === 'has-dog'
          ? tx('ステップ1/2・飼い主プロフィール', 'Step 1 of 2 · Owner profile')
          : tx('ステップ1・飼い主プロフィール', 'Step 1 · Owner profile')
      }
    >
      <OwnerForm
        submitLabel={tx('次へ', 'Next')}
        onPetStatusChange={setPetStatus}
        onSubmit={(v) => {
          const owner = { id: 'owner-1', verified: false, ...v };
          setOwner(owner);
          void saveProfileRemote(owner);
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
