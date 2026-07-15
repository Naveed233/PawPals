import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';

import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { useI18n } from '@/lib/i18n';
import { saveDogRemote } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';

export default function EditDog() {
  const router = useRouter();
  const { tx } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dog = useStore((s) => s.dogs.find((d) => d.id === id));
  const updateDog = useStore((s) => s.updateDog);

  if (!dog) {
    return (
      <Screen title={tx('ペットプロフィールを編集', 'Edit pet profile')} onBack={() => router.back()}>
        <Text
          style={{
            color: night.muted,
            fontSize: font.body,
            textAlign: 'center',
            marginTop: spacing.xl,
          }}
        >
          {tx(
            'このペットプロフィールは見つかりませんでした。',
            "We couldn't find this pet profile.",
          )}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={tx('ペットプロフィールを編集', 'Edit pet profile')}
      subtitle={dog.name}
      onBack={() => router.back()}
    >
      <DogForm
        initial={dog}
        submitLabel={tx('変更を保存', 'Save changes')}
        onSubmit={(v) => {
          updateDog(dog.id, v);
          void saveDogRemote({ ...dog, ...v });
          router.back();
        }}
      />
    </Screen>
  );
}
