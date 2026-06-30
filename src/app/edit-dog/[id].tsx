import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';

import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';
import { colors, font, spacing } from '@/theme';

export default function EditDog() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dog = useStore((s) => s.dogs.find((d) => d.id === id));
  const updateDog = useStore((s) => s.updateDog);

  if (!dog) {
    return (
      <Screen title="Edit dog" onBack={() => router.back()}>
        <Text style={{ color: colors.muted, fontSize: font.body, textAlign: 'center', marginTop: spacing.xl }}>
          This dog profile is no longer available.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen title={`Edit ${dog.name}`} onBack={() => router.back()}>
      <DogForm
        initial={dog}
        submitLabel="Save changes"
        onSubmit={(v) => {
          updateDog(dog.id, v);
          router.back();
        }}
      />
    </Screen>
  );
}
