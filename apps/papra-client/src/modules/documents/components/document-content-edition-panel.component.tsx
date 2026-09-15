import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import { useMutation, useQueryClient } from '@tanstack/solid-query';
import { createSignal, Show } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { Alert, AlertDescription } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextFieldRoot } from '@/modules/ui/components/textfield';
import { useReprocessDocument } from '../documents.composables';
import { updateDocument } from '../documents.services';

export const DocumentContentEditionPanel: Component<{ document: Document }> = (props) => {
  const { t } = useI18n();
  const { config } = useConfig();
  const { reprocess, getIsReprocessing } = useReprocessDocument();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = createSignal(false);
  const [getContent, setContent] = createSignal(props.document.content);

  const updateMutation = useMutation(() => ({
    mutationFn: async ({ content }: { content: string }) =>
      updateDocument({
        documentId: props.document.id,
        organizationId: props.document.organizationId,
        content,
      }),
    onSuccess: () => {
      createToast({ type: 'success', message: 'Document content updated' });
      setIsEditing(false);
      void queryClient.invalidateQueries({
        queryKey: ['organizations', props.document.organizationId, 'documents', props.document.id],
      });
    },
    onError: () => {
      createToast({ type: 'error', message: 'Failed to update document content' });
    },
  }));

  const handleEdit = () => {
    setContent(props.document.content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(props.document.content);
  };

  const handleSave = () => {
    updateMutation.mutate({ content: getContent() });
  };

  return (
    <div class="flex flex-col gap-2">
      <TextFieldRoot>
        <TextArea
          value={isEditing() ? getContent() : props.document.content}
          onInput={(e) => setContent(e.currentTarget.value)}
          class={cn('font-mono placeholder:italic max-h-500px', {
            'bg-muted text-muted-foreground': !isEditing(),
          })}
          readonly={!isEditing()}
          placeholder={t('documents.content.empty-placeholder')}
          rows={2}
          autoResize
        />
      </TextFieldRoot>
      <div class="flex flex-wrap justify-end gap-2">
        <Show
          when={config.documents.isReprocessingEnabled && !props.document.isDeleted && !isEditing()}
        >
          <Button
            variant="outline"
            onClick={async () => reprocess({ document: props.document })}
            isLoading={getIsReprocessing()}
          >
            <div class="i-tabler-refresh size-4 mr-2" />
            {t('documents.reprocess.action')}
          </Button>
        </Show>
        <Show
          when={isEditing()}
          fallback={
            <Button variant="outline" onClick={handleEdit} disabled={getIsReprocessing()}>
              <div class="i-tabler-edit size-4 mr-2" />
              {t('documents.actions.edit')}
            </Button>
          }
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
        <AlertDescription>{t('documents.content.alert')}</AlertDescription>
      </Alert>
    </div>
  );
};
