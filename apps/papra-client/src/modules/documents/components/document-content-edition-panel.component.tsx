import type { Component } from 'solid-js';
import { useMutation, useQueryClient } from '@tanstack/solid-query';
import { createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { Alert, AlertDescription } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextFieldRoot } from '@/modules/ui/components/textfield';
import { updateDocument } from '../documents.services';

export const DocumentContentEditionPanel: Component<{
  documentId: string;
  organizationId: string;
  content: string;
}> = (props) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = createSignal(false);
  const [getContent, setContent] = createSignal(props.content);

  const updateMutation = useMutation(() => ({
    mutationFn: ({ content }: { content: string }) => updateDocument({
      documentId: props.documentId,
      organizationId: props.organizationId,
      content,
    }),
    onSuccess: () => {
      createToast({ type: 'success', message: 'Document content updated' });
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'documents', props.documentId],
      });
    },
    onError: () => {
      createToast({ type: 'error', message: 'Failed to update document content' });
    },
  }));

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(props.content);
  };

  const handleSave = () => {
    updateMutation.mutate({ content: getContent() });
  };

  return (
    <div class="flex flex-col gap-2">
      <TextFieldRoot>
        <TextArea
          value={getContent()}
          onInput={e => setContent(e.currentTarget.value)}
          class={cn('font-mono placeholder:italic max-h-500px', { 'bg-muted text-muted-foreground': !isEditing() })}
          readonly={!isEditing()}
          placeholder={t('documents.content.empty-placeholder')}
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

      <Alert variant="muted" class="my-4 flex items-center gap-2">
        <div class="i-tabler-info-circle size-8 flex-shrink-0" />
        <AlertDescription>
          {t('documents.content.alert')}
        </AlertDescription>
      </Alert>
    </div>
  );
};
