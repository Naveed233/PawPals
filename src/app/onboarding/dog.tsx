import { useRouter } from 'expo-router';

import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';

export default function DogOnboarding() {
  const router = useRouter();
  const owner = useStore((s) => s.owner);
  const addDog = useStore((s) => s.addDog);

  return (
    <Screen title="Your dog" subtitle="Step 2 of 2 · Dog profile">
      <DogForm
        submitLabel="Finish & start matching"
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
