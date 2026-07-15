import { useRouter } from 'expo-router';

import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { useI18n } from '@/lib/i18n';
import { saveDogRemote } from '@/lib/sync';
import { useStore } from '@/store';

export default function DogOnboarding() {
  const router = useRouter();
  const { tx } = useI18n();
  const owner = useStore((s) => s.owner);
  const addDog = useStore((s) => s.addDog);

  return (
    <Screen title={tx('あなたのワンちゃん', 'Your dog')} subtitle={tx('ステップ2/2・ペットプロフィール', 'Step 2 of 2 · Pet profile')}>
      <DogForm
        submitLabel={tx('完了してマッチングを始める', 'Finish and start matching')}
        onSubmit={(v) => {
          if (!owner) return;
          const dog = {
            id: `mydog-${Date.now()}`,
            ownerId: owner.id,
            ownerName: owner.firstName,
            ownerArea: owner.area,
            ownerVerified: owner.verified,
            favourite: [],
            distanceKm: 0,
            ...v,
          };
          addDog(dog);
          void saveDogRemote(dog);
          router.replace('/(tabs)');
        }}
      />
    </Screen>
  );
}
