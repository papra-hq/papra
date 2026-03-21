import type { Component } from 'solid-js';
import { useMutation, useQueryClient } from '@tanstack/solid-query';
import { createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextFieldRoot } from '@/modules/ui/components/textfield';
import { updateDocument } from '../documents.services';

export const DocumentNotesEditionPanel: Component<{
  documentId: string;
  organizationId: string;
  notes?: string | null;
}> = (props) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = createSignal(false);
  const [getNotes, setNotes] = createSignal(props.notes ?? '');

  const updateMutation = useMutation(() => ({
    mutationFn: ({ notes }: { notes: string | null }) => updateDocument({
      documentId: props.documentId,
      organizationId: props.organizationId,
      notes,
    }),
    onSuccess: () => {
      createToast({ type: 'success', message: t('documents.notes.updated') });
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'documents', props.documentId],
      });
    },
    onError: () => {
      createToast({ type: 'error', message: t('documents.notes.update-failed') });
    },
  }));

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNotes(props.notes ?? '');
  };

  const handleSave = () => {
    const value = getNotes().trim();
    updateMutation.mutate({ notes: value.length > 0 ? value : null });
  };

  return (
    <div class="flex flex-col gap-2">
      <TextFieldRoot>
        <TextArea
          value={getNotes()}
          onInput={e => setNotes(e.currentTarget.value)}
          class={cn('placeholder:italic max-h-500px', { 'bg-muted text-muted-foreground': !isEditing() })}
          readonly={!isEditing()}
          placeholder={t('documents.notes.empty-placeholder')}
          rows={2}
          autoResize
        />
      </TextFieldRoot>
      <div class="flex justify-end gap-2">
        <Show
          when={isEditing()}
          fallback={(
            <Button variant="outline" onClick={handleEdit}>
              <div class="i-tabler-edit size-4 mr-2" />
              {t('documents.actions.edit')}
            </Button>
          )}
        >
          <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
            {t('documents.actions.cancel')}
          </Button>
          <Button onClick={handleSave} isLoading={updateMutation.isPending}>
            {updateMutation.isPending ? t('documents.actions.saving') : t('documents.actions.save')}
          </Button>
        </Show>
      </div>
    </div>
  );
};
