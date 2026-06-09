import type { Component } from 'solid-js';
import { createEffect, createSignal, on, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { DocumentTagPicker } from '@/modules/tags/components/tag-picker.component';
import { Button } from '@/modules/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/ui/components/dialog';

export const DocumentsBatchTagDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  selectionCount: number;
  isPending?: boolean;
  onSubmit: (args: { addTagIds: string[]; removeTagIds: string[] }) => void;
}> = (props) => {
  const { t } = useI18n();
  const [getAddTagIds, setAddTagIds] = createSignal<string[]>([]);
  const [getRemoveTagIds, setRemoveTagIds] = createSignal<string[]>([]);

  const overlap = () => {
    const removeSet = new Set(getRemoveTagIds());
    return getAddTagIds().some((id) => removeSet.has(id));
  };

  const canSubmit = () => !overlap() && (getAddTagIds().length > 0 || getRemoveTagIds().length > 0);

  function handleSubmit() {
    if (!canSubmit()) {
      return;
    }
    props.onSubmit({ addTagIds: getAddTagIds(), removeTagIds: getRemoveTagIds() });
  }

  createEffect(
    on(
      () => props.open,
      () => {
        setAddTagIds([]);
        setRemoveTagIds([]);
      },
    ),
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('documents.list.batch.tags.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('documents.list.batch.tags.dialog.description', { count: props.selectionCount })}
          </DialogDescription>
        </DialogHeader>

        <Show when={props.open}>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">
                {t('documents.list.batch.tags.dialog.add-label')}
              </label>
              <DocumentTagPicker
                organizationId={props.organizationId}
                tagIds={[]}
                onTagsChange={({ tags }) => setAddTagIds(tags.map((tag) => tag.id))}
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">
                {t('documents.list.batch.tags.dialog.remove-label')}
              </label>
              <DocumentTagPicker
                organizationId={props.organizationId}
                tagIds={[]}
                onTagsChange={({ tags }) => setRemoveTagIds(tags.map((tag) => tag.id))}
              />
            </div>

            <Show when={overlap()}>
              <p class="text-sm text-red-500">
                {t('documents.list.batch.tags.dialog.overlap-error')}
              </p>
            </Show>
          </div>
        </Show>

        <DialogFooter>
          <div class="flex gap-2 justify-end flex-col-reverse sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => props.onOpenChange(false)}
              disabled={props.isPending}
            >
              {t('documents.list.batch.tags.dialog.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || props.isPending}
              isLoading={props.isPending}
            >
              {t('documents.list.batch.tags.dialog.submit')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
