import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';

import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';

export default function EditDog() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dog = useStore((s) => s.dogs.find((d) => d.id === id));
  const updateDog = useStore((s) => s.updateDog);

  if (!dog) {
    return (
      <Screen title="ペットプロフィールを編集" onBack={() => router.back()}>
        <Text
          style={{
            color: night.muted,
            fontSize: font.body,
            textAlign: 'center',
            marginTop: spacing.xl,
          }}
        >
          このペットプロフィールは見つかりませんでした。
        </Text>
      </Screen>
    );
  }

  return (
    <Screen title="ペットプロフィールを編集" subtitle={dog.name} onBack={() => router.back()}>
      <DogForm
        initial={dog}
        submitLabel="変更を保存"
        onSubmit={(v) => {
          updateDog(dog.id, v);
          router.back();
        }}
      />
    </Screen>
  );
}
