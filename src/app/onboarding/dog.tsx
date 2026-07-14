import { useRouter } from 'expo-router';

import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';

export default function DogOnboarding() {
  const router = useRouter();
  const owner = useStore((s) => s.owner);
  const addDog = useStore((s) => s.addDog);

  return (
    <Screen title="あなたのワンちゃん" subtitle="ステップ2/2・ペットプロフィール">
      <DogForm
        submitLabel="完了してマッチングを始める"
        onSubmit={(v) => {
          if (!owner) return;
          addDog({
            id: `mydog-${Date.now()}`,
            ownerId: owner.id,
            ownerName: owner.firstName,
            ownerArea: owner.area,
            ownerVerified: owner.verified,
            favourite: [],
            distanceKm: 0,
            ...v,
          });
          router.replace('/(tabs)');
        }}
      />
    </Screen>
  );
}
