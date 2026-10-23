import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '@/lib/nav';
import { useState } from 'react';
import { Text } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { DogForm } from '@/components/DogForm';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { deleteDogRemote, saveDogRemote, saveProfileRemote } from '@/lib/sync';
import { useStore } from '@/store';
import { font, night, spacing } from '@/theme';

/** What happens after a delete: back to the profile, or the only-dog choices. */
type AfterDelete = 'back' | 'add-another' | 'no-dog-now';

export default function EditDog() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)/profile');
  const { tx } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dog = useStore((s) => s.dogs.find((d) => d.id === id));
  const dogCount = useStore((s) => s.dogs.length);
  const owner = useStore((s) => s.owner);
  const updateDog = useStore((s) => s.updateDog);
  const removeDog = useStore((s) => s.removeDog);
  const updateOwner = useStore((s) => s.updateOwner);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Gone because we just deleted it: render nothing while navigation runs.
  if (!dog && deleted) return null;

  if (!dog) {
    return (
      <Screen title={tx('ペットプロフィールを編集', 'Edit pet profile')} onBack={() => goBack()}>
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

  const remove = async (after: AfterDelete) => {
    setConfirmOpen(false);
    setDeleting(true);
    setDeleteFailed(false);
    // Server first: if it fails the dog stays, rather than vanishing here and
    // coming back at the next sign-in.
    const ok = await deleteDogRemote(dog);
    if (!ok) {
      setDeleting(false);
      setDeleteFailed(true);
      return;
    }
    if (after === 'no-dog-now' && owner) {
      updateOwner({ petStatus: 'no-pet-future' });
      void saveProfileRemote({ ...owner, petStatus: 'no-pet-future' });
    }
    setDeleted(true);
    removeDog(dog.id);
    if (after === 'add-another') router.replace('/onboarding/dog');
    else goBack();
  };

  // Deleting your only dog would otherwise send you to "add your dog" on the
  // next launch (index.tsx), so ask which of the two you mean.
  const onlyDog = dogCount === 1 && (owner?.petStatus ?? 'has-dog') === 'has-dog';
  const actions: SheetAction[] = onlyDog
    ? [
        {
          key: 'add-another',
          emoji: '🐕',
          destructive: true,
          label: tx('削除して、別の子を登録', 'Delete and add another dog'),
          onPress: () => void remove('add-another'),
        },
        {
          key: 'no-dog-now',
          emoji: '🗑️',
          destructive: true,
          label: tx('削除する（今は犬を飼っていない）', "Delete (I don't have a dog now)"),
          sublabel: tx(
            'プロフィールを「今は飼っていない」に変更します',
            'Your profile changes to "No pet right now"',
          ),
          onPress: () => void remove('no-dog-now'),
        },
      ]
    : [
        {
          key: 'delete',
          emoji: '🗑️',
          destructive: true,
          label: tx('完全に削除する', 'Delete permanently'),
          onPress: () => void remove('back'),
        },
      ];

  return (
    <Screen
      title={tx('ペットプロフィールを編集', 'Edit pet profile')}
      subtitle={dog.name}
      onBack={() => goBack()}
    >
      <DogForm
        initial={dog}
        submitLabel={tx('変更を保存', 'Save changes')}
        onSubmit={(v) => {
          updateDog(dog.id, v);
          void saveDogRemote({ ...dog, ...v });
          goBack();
        }}
      />

      <Button
        label={tx(`${dog.name}を削除`, `Delete ${dog.name}`)}
        variant="dangerGhost"
        loading={deleting}
        onPress={() => setConfirmOpen(true)}
        style={{ marginTop: spacing.lg }}
      />
      {deleteFailed && (
        <Text
          accessibilityRole="alert"
          style={{
            color: night.danger,
            fontSize: font.small,
            fontWeight: '600',
            textAlign: 'center',
            marginTop: spacing.sm,
          }}
        >
          {tx(
            '削除できませんでした。\n通信状況を確認して、もう一度お試しください。',
            "Couldn't delete.\nCheck your connection and try again.",
          )}
        </Text>
      )}

      <ActionSheet
        visible={confirmOpen}
        title={tx(`${dog.name}を削除しますか？`, `Delete ${dog.name}?`)}
        message={tx(
          'プロフィールと写真が完全に削除されます。この操作は取り消せません。',
          'Their profile and photos are permanently deleted. This cannot be undone.',
        )}
        actions={actions}
        onClose={() => setConfirmOpen(false)}
      />
    </Screen>
  );
}
