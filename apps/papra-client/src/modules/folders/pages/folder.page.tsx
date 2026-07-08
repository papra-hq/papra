import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { A, useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createMemo, createSignal, For, Show } from 'solid-js';
import { getDocumentIcon } from '@/modules/documents/document.models';
import { DocumentManagementDropdown } from '@/modules/documents/components/document-management-dropdown.component';
import { invalidateOrganizationDocumentsQuery } from '@/modules/documents/documents.composables';
import { uploadDocument } from '@/modules/documents/documents.services';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/ui/components/table';
import { buildFolderPath } from '../composables/folder-tree';
import { CreateFolderDialog, RenameFolderDialog } from '../components/folder-dialogs.component';
import { deleteFolder, fetchFolderContents, fetchOrganizationFolders } from '../folders.services';
import type { Folder } from '../folders.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/ui/components/dropdown-menu';

const FolderCard: Component<{ organizationId: string; folder: Folder }> = (props) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const [getIsRenameOpen, setIsRenameOpen] = createSignal(false);

  const deleteMutation = useMutation(() => ({
    mutationFn: async ({ force }: { force: boolean }) =>
      deleteFolder({ organizationId: props.organizationId, folderId: props.folder.id, force }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'folders'],
        refetchType: 'all',
      });
      createToast({ message: t('folders.delete.success'), type: 'success' });
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('folders.delete.confirm.title'),
      message: t('folders.delete.confirm.message'),
      confirmButton: { text: t('folders.delete.confirm.confirm-button'), variant: 'destructive' },
      cancelButton: { text: t('folders.delete.confirm.cancel-button') },
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ force: false });
    } catch (error) {
      // 409 folders.not_empty -> offer a force-delete as a second confirmation
      const status = (error as { statusCode?: number })?.statusCode;

      if (status !== 409) {
        return;
      }

      const confirmedForce = await confirm({
        title: t('folders.delete.confirm.title'),
        message: t('folders.delete.confirm.not-empty-message'),
        confirmButton: { text: t('folders.delete.confirm.confirm-button'), variant: 'destructive' },
        cancelButton: { text: t('folders.delete.confirm.cancel-button') },
      });

      if (confirmedForce) {
        await deleteMutation.mutateAsync({ force: true });
      }
    }
  };

  return (
    <div class="flex items-center gap-2 border rounded-lg p-3 hover:bg-accent/30 transition">
      <A
        href={`/organizations/${props.organizationId}/folders/${props.folder.id}`}
        class="flex items-center gap-2 flex-1 min-w-0"
      >
        <div class="i-tabler-folder-filled size-6 text-primary flex-shrink-0" />
        <div class="min-w-0">
          <div class="font-medium truncate">{props.folder.name}</div>
          <div class="text-xs text-muted-foreground">
            {t('folders.documents-count', { count: props.folder.documentsCount ?? 0 })}
          </div>
        </div>
      </A>

      <DropdownMenu>
        <DropdownMenuTrigger
          as={(triggerProps: DialogTriggerProps) => (
            <Button variant="ghost" size="icon" {...triggerProps}>
              <div class="i-tabler-dots-vertical size-4" />
            </Button>
          )}
        />
        <DropdownMenuContent class="w-40">
          <DropdownMenuItem class="cursor-pointer" onClick={() => setIsRenameOpen(true)}>
            <div class="i-tabler-pencil size-4 mr-2" />
            <span>{t('folders.subfolders.actions.rename')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem class="cursor-pointer text-red" onClick={handleDelete}>
            <div class="i-tabler-trash size-4 mr-2" />
            <span>{t('folders.subfolders.actions.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Show when={getIsRenameOpen()}>
        <RenameFolderDialog
          open={getIsRenameOpen()}
          onOpenChange={setIsRenameOpen}
          organizationId={props.organizationId}
          folder={props.folder}
        />
      </Show>
    </div>
  );
};

export const FolderPage: Component = () => {
  const params = useParams<{ organizationId: string; folderId?: string }>();
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });
  let fileInputRef: HTMLInputElement | undefined;

  const currentFolderId = () => params.folderId ?? null;

  const contentsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'folders', 'contents', currentFolderId()],
    queryFn: async () =>
      fetchFolderContents({ organizationId: params.organizationId, folderId: currentFolderId() }),
  }));

  // Flat list is cheap (capped per-org) and lets us build the breadcrumb path
  // client-side without one request per ancestor.
  const allFoldersQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'folders'],
    queryFn: async () => fetchOrganizationFolders({ organizationId: params.organizationId }),
  }));

  const getBreadcrumbPath = createMemo(() => {
    const folders = allFoldersQuery.data?.folders ?? [];
    const { path } = buildFolderPath({ folders, folderId: currentFolderId() });
    return path;
  });

  const uploadMutation = useMutation(() => ({
    mutationFn: async (file: File) =>
      uploadDocument({
        file,
        organizationId: params.organizationId,
        folderId: currentFolderId(),
      }),
    onSuccess: async () => {
      await Promise.all([
        contentsQuery.refetch(),
        invalidateOrganizationDocumentsQuery({ organizationId: params.organizationId }),
        queryClient.invalidateQueries({
          queryKey: ['organizations', params.organizationId, 'folders'],
          refetchType: 'all',
        }),
      ]);
      createToast({ message: t('folders.upload.success'), type: 'success' });
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const handleFileSelected = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void uploadMutation.mutateAsync(file);
    }
    input.value = '';
  };

  const getIsEmpty = () =>
    (contentsQuery.data?.folders.length ?? 0) === 0 &&
    (contentsQuery.data?.documents.length ?? 0) === 0;

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-5xl">
      <div class="flex justify-between sm:items-center pb-6 gap-4 flex-col sm:flex-row">
        <div class="flex items-center gap-1 flex-wrap text-sm">
          <A
            href={`/organizations/${params.organizationId}/folders`}
            class="flex items-center gap-1 hover:underline font-medium"
            classList={{ 'text-muted-foreground': Boolean(currentFolderId()) }}
          >
            <div class="i-tabler-home size-4" />
            {t('folders.root-label')}
          </A>
          <For each={getBreadcrumbPath()}>
            {(folder, index) => (
              <>
                <div class="i-tabler-chevron-right size-3.5 text-muted-foreground" />
                <A
                  href={`/organizations/${params.organizationId}/folders/${folder.id}`}
                  class="hover:underline"
                  classList={{
                    'font-medium': index() === getBreadcrumbPath().length - 1,
                    'text-muted-foreground': index() !== getBreadcrumbPath().length - 1,
                  }}
                >
                  {folder.name}
                </A>
              </>
            )}
          </For>
        </div>

        <div class="flex gap-2 flex-shrink-0">
          <CreateFolderDialog organizationId={params.organizationId} parentId={currentFolderId()}>
            {(dialogProps) => (
              <Button variant="outline" {...dialogProps}>
                <div class="i-tabler-folder-plus size-4 mr-2" />
                {t('folders.new-folder')}
              </Button>
            )}
          </CreateFolderDialog>

          <input
            ref={(el) => (fileInputRef = el)}
            type="file"
            class="hidden"
            onChange={handleFileSelected}
          />
          <Button onClick={() => fileInputRef?.click()} isLoading={uploadMutation.isPending}>
            <div class="i-tabler-upload size-4 mr-2" />
            {t('folders.upload-here')}
          </Button>
        </div>
      </div>

      <Show when={contentsQuery.data}>
        {(getData) => (
          <Show
            when={!getIsEmpty()}
            fallback={
              <EmptyState
                title={t('folders.empty.title')}
                icon="i-tabler-folder-open"
                description={t('folders.empty.description')}
              />
            }
          >
            <Show when={getData().folders.length > 0}>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <For each={getData().folders}>
                  {(folder) => (
                    <FolderCard organizationId={params.organizationId} folder={folder} />
                  )}
                </For>
              </div>
            </Show>

            <Show when={getData().documents.length > 0}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('folders.table.headers.name')}</TableHead>
                    <TableHead>{t('folders.table.headers.size')}</TableHead>
                    <TableHead>{t('folders.table.headers.created')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={getData().documents}>
                    {(document) => (
                      <TableRow>
                        <TableCell>
                          <A
                            href={`/organizations/${params.organizationId}/documents/${document.id}`}
                            class="flex items-center gap-2 hover:underline"
                          >
                            <div
                              class={`${getDocumentIcon({ document })} size-5 text-primary flex-shrink-0`}
                            />
                            <span class="truncate">{document.name}</span>
                          </A>
                        </TableCell>
                        <TableCell class="text-muted-foreground">
                          {formatBytes({ bytes: document.originalSize, base: 1000 })}
                        </TableCell>
                        <TableCell class="text-muted-foreground">
                          <RelativeTime date={document.createdAt} />
                        </TableCell>
                        <TableCell class="text-right">
                          <DocumentManagementDropdown document={document} />
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </Show>
          </Show>
        )}
      </Show>
    </div>
  );
};
