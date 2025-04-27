import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { queryClient } from '@/modules/shared/query/query-client';
import { Alert, AlertDescription } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { useParams } from '@solidjs/router';
import { createMutation, createQuery, keepPreviousData } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import { DocumentsPaginatedList } from '../components/documents-list.component';
import { useRestoreDocument } from '../documents.composables';
import { deleteAllTrashDocuments, deleteTrashDocument, fetchOrganizationDeletedDocuments } from '../documents.services';

const RestoreDocumentButton: Component<{ document: Document }> = (props) => {
  const { getIsRestoring, restore } = useRestoreDocument();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => restore({ document: props.document })}
      isLoading={getIsRestoring()}
    >
      { getIsRestoring()
        ? (<>Restoring...</>)
        : (
            <>
              <div class="i-tabler-refresh size-4 mr-2" />
              Restore
            </>
          )}
    </Button>
  );
};

const PermanentlyDeleteTrashDocumentButton: Component<{ document: Document; organizationId: string }> = (props) => {
  const { confirm } = useConfirmModal();
  const { t } = useI18n();

  const deleteMutation = createMutation(() => ({
    mutationFn: async () => {
      await deleteTrashDocument({ documentId: props.document.id, organizationId: props.organizationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', props.organizationId, 'documents', 'deleted'] });

      createToast({
        message: t('trash.deleted.success.title'),
        description: t('trash.deleted.success.description'),
      });
    },
  }));

  const handleClick = async () => {
    if (!await confirm({
      title: t('trash.delete.confirm.title'),
      message: t('trash.delete.confirm.description'),
      confirmButton: {
        text: t('trash.delete.confirm.label'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('trash.delete.confirm.cancel'),
      },
    })) {
      return;
    }

    deleteMutation.mutate();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      isLoading={deleteMutation.isPending}
      class="text-red-500 hover:text-red-600"
    >
      {deleteMutation.isPending
        ? (<>Deleting...</>)
        : (
            <>
              <div class="i-tabler-trash size-4 mr-2" />
              {t('trash.delete.button')}
            </>
          )}
    </Button>
  );
};

const DeleteAllTrashDocumentsButton: Component<{ organizationId: string }> = (props) => {
  const { confirm } = useConfirmModal();
  const { t } = useI18n();

  const deleteAllMutation = createMutation(() => ({
    mutationFn: async () => {
      await deleteAllTrashDocuments({ organizationId: props.organizationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', props.organizationId, 'documents', 'deleted'] });
    },
  }));

  const handleClick = async () => {
    if (!await confirm({
      title: t('trash.delete-all.confirm.title'),
      message: t('trash.delete-all.confirm.description'),
      confirmButton: {
        text: t('trash.delete-all.confirm.label'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('trash.delete-all.confirm.cancel'),
      },
    })) {
      return;
    }

    deleteAllMutation.mutate();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      isLoading={deleteAllMutation.isPending}
      class="text-red-500 hover:text-red-600"
    >
      {deleteAllMutation.isPending
        ? (<>Deleting...</>)
        : (
            <>
              <div class="i-tabler-trash size-4 mr-2" />
              {t('trash.delete-all.button')}
            </>
          )}
    </Button>
  );
};

export const DeletedDocumentsPage: Component = () => {
  const [getPagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 100 });
  const params = useParams();
  const { config } = useConfig();

  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', 'deleted', getPagination()],
    queryFn: () => fetchOrganizationDeletedDocuments({
      organizationId: params.organizationId,
      ...getPagination(),
    }),
    placeholderData: keepPreviousData,
  }));

  return (
    <div class="p-6 mt-4 pb-32">
      <h1 class="text-2xl font-bold">Deleted documents</h1>

      <Alert variant="muted" class="my-4 flex items-center gap-6 xl:gap-4">
        <div class="i-tabler-info-circle size-10 xl:size-8 text-primary flex-shrink-0 hidden sm:block" />
        <AlertDescription>
          All deleted documents are stored in the trash bin for
          {' '}
          {config.documents.deletedDocumentsRetentionDays}
          {' '}
          days. Passing this delay, the documents will be permanently deleted, and you will not be able to restore them.
        </AlertDescription>
      </Alert>

      <Suspense>
        <Show when={query.data?.documents.length === 0}>
          <div class="flex flex-col items-center justify-center gap-2 pt-24 mx-auto max-w-md text-center">
            <div class="i-tabler-trash text-primary size-12" aria-hidden="true" />
            <div class="text-xl font-medium">No deleted documents</div>
            <div class="text-sm  text-muted-foreground">
              You have no deleted documents. Documents that are deleted will be moved to the trash bin for
              {' '}
              {config.documents.deletedDocumentsRetentionDays}
              {' '}
              days.
            </div>
          </div>
        </Show>

        <Show when={query.data && query.data?.documents.length > 0}>
          <div class="flex items-center justify-end gap-2">
            <DeleteAllTrashDocumentsButton organizationId={params.organizationId} />
          </div>

          <DocumentsPaginatedList
            documents={query.data?.documents ?? []}
            documentsCount={query.data?.documentsCount ?? 0}
            getPagination={getPagination}
            setPagination={setPagination}
            extraColumns={[
              {
                id: 'deletion',
                cell: data => (
                  <div class="text-muted-foreground hidden sm:block">
                    Deleted
                    {' '}
                    <span class="text-foreground font-bold" title={data.row.original.deletedAt?.toLocaleString()}>{timeAgo({ date: data.row.original.deletedAt! })}</span>
                  </div>
                ),
              },
              {
                id: 'actions',
                cell: data => (
                  <div class="flex items-center justify-end gap-2">
                    <RestoreDocumentButton document={data.row.original} />
                    <PermanentlyDeleteTrashDocumentButton document={data.row.original} organizationId={params.organizationId} />
                  </div>
                ),
              },
            ]}
          />
        </Show>
      </Suspense>
    </div>
  );
};
