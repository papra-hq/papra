import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import type { Tag } from '@/modules/tags/tags.types';
import { createSignal, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { TagPicker } from '@/modules/tags/components/tag-list.component';
import { Button } from '@/modules/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { createToast } from '@/modules/ui/components/sonner';
import { bulkAddTagToDocuments, bulkDeleteDocuments } from '../documents.bulk-actions';

export const BulkActionsToolbar: Component<{
  selectedDocuments: Document[];
  organizationId: string;
  onClearSelection: () => void;
}> = (props) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const [getIsTagPopoverOpen, setIsTagPopoverOpen] = createSignal(false);
  const [getIsDeleting, setIsDeleting] = createSignal(false);
  const [getIsTagging, setIsTagging] = createSignal(false);

  const handleTagSelected = async (tags: Tag[]) => {
    const tagId = tags[tags.length - 1]?.id;
    if (!tagId) {
      return;
    }

    setIsTagPopoverOpen(false);
    setIsTagging(true);

    const { successCount, errorCount } = await bulkAddTagToDocuments({
      documentIds: props.selectedDocuments.map(d => d.id),
      organizationId: props.organizationId,
      tagId,
    });

    setIsTagging(false);

    createToast({
      type: 'success',
      message: t('documents.list.bulk-actions.add-tags-success', { count: successCount }),
    });

    if (errorCount > 0) {
      createToast({
        type: 'error',
        message: t('documents.list.bulk-actions.partial-error', { errorCount }),
      });
    }
  };

  const handleBulkDelete = async () => {
    const count = props.selectedDocuments.length;

    const isConfirmed = await confirm({
      title: t('documents.list.bulk-actions.delete-confirm.title', { count }),
      message: t('documents.list.bulk-actions.delete-confirm.message', { count }),
      confirmButton: {
        text: t('documents.list.bulk-actions.delete'),
        variant: 'destructive',
      },
    });

    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);

    const { successCount, errorCount } = await bulkDeleteDocuments({
      documentIds: props.selectedDocuments.map(d => d.id),
      organizationId: props.organizationId,
    });

    setIsDeleting(false);
    props.onClearSelection();

    createToast({
      type: 'success',
      message: t('documents.list.bulk-actions.delete-success', { count: successCount }),
    });

    if (errorCount > 0) {
      createToast({
        type: 'error',
        message: t('documents.list.bulk-actions.partial-error', { errorCount }),
      });
    }
  };

  return (
    <Show when={props.selectedDocuments.length > 0}>
      <div class="flex-1 flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
        <Popover open={getIsTagPopoverOpen()} onOpenChange={setIsTagPopoverOpen}>
          <PopoverTrigger
            as={Button}
            variant="outline"
            size="sm"
            class="h-7 gap-1 cursor-pointer"
            isLoading={getIsTagging()}
          >
            <div class="i-tabler-tag size-4" />
            {t('documents.list.bulk-actions.add-tags')}
          </PopoverTrigger>
          <PopoverContent class="p-0">
            <Suspense>
              <TagPicker
                selectedTags={[]}
                onChange={handleTagSelected}
                organizationId={props.organizationId}
                isOpen={getIsTagPopoverOpen()}
              />
            </Suspense>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          class="h-7 gap-1 cursor-pointer text-destructive hover:text-destructive"
          onClick={handleBulkDelete}
          isLoading={getIsDeleting()}
        >
          <div class="i-tabler-trash size-4" />
          {t('documents.list.bulk-actions.delete')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-7 gap-1 cursor-pointer ml-auto"
          onClick={() => props.onClearSelection()}
        >
          <div class="i-tabler-x size-4" />
          {t('documents.list.bulk-actions.clear')}
        </Button>
      </div>
    </Show>
  );
};
