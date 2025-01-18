import type { Document } from '../documents.types';
import { useConfig } from '@/modules/config/config.provider';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { Alert, AlertDescription } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { useParams } from '@solidjs/router';
import { createQuery, keepPreviousData } from '@tanstack/solid-query';
import { type Component, createSignal, Show, Suspense } from 'solid-js';
import { DocumentsPaginatedList } from '../components/documents-list.component';
import { useRestoreDocument } from '../documents.composables';
import { fetchOrganizationDeletedDocuments } from '../documents.services';

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
                  <div class="flex items-center justify-end">
                    <RestoreDocumentButton document={data.row.original} />
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
