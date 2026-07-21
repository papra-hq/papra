import type { Component } from 'solid-js';
import type { Document } from '@/modules/documents/documents.types';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import { updateDocument } from '@/modules/documents/documents.services';
import { invalidateOrganizationDocumentsQuery } from '@/modules/documents/documents.composables';
import { fetchOrganizationFolders } from '../folders.services';
import { buildIndentedFolderList } from '../composables/folder-tree';
import type { Folder } from '../folders.types';

type FolderOption = { id: string | null; label: string };

export const MoveDocumentDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
}> = (props) => {
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const foldersQuery = useQuery(() => ({
    queryKey: ['organizations', props.document.organizationId, 'folders'],
    queryFn: async () =>
      fetchOrganizationFolders({ organizationId: props.document.organizationId }),
  }));

  const getOptions = createMemo<FolderOption[]>(() => {
    const folders = foldersQuery.data?.folders ?? [];
    const { indentedFolders } = buildIndentedFolderList({ folders });

    return [
      { id: null, label: t('folders.root-label') },
      ...indentedFolders.map(({ folder, depth }: { folder: Folder; depth: number }) => ({
        id: folder.id,
        label: `${'— '.repeat(depth)}${folder.name}`,
      })),
    ];
  });

  const moveMutation = useMutation(() => ({
    mutationFn: async (folderId: string | null) =>
      updateDocument({
        documentId: props.document.id,
        organizationId: props.document.organizationId,
        folderId,
      }),
    onSuccess: async () => {
      await Promise.all([
        invalidateOrganizationDocumentsQuery({ organizationId: props.document.organizationId }),
        queryClient.invalidateQueries({
          queryKey: ['organizations', props.document.organizationId, 'folders'],
          refetchType: 'all',
        }),
      ]);

      createToast({ message: t('folders.move.success'), type: 'success' });
      props.onOpenChange(false);
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('folders.move.title')}</DialogTitle>
        </DialogHeader>

        <Select<FolderOption>
          options={getOptions()}
          optionValue="id"
          optionTextValue="label"
          value={getOptions().find((option) => option.id === (props.document.folderId ?? null))}
          onChange={(value) => {
            if (!value) {
              return;
            }
            moveMutation.mutate(value.id);
          }}
          itemComponent={(itemProps) => (
            <SelectItem class="cursor-pointer" item={itemProps.item}>
              {itemProps.item.rawValue.label}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<FolderOption>>
              {(state) => state.selectedOption()?.label ?? t('folders.move.select-placeholder')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <div class="flex justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={moveMutation.isPending}
          >
            {t('folders.delete.confirm.cancel-button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
