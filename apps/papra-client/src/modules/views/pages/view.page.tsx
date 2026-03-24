import type { Component } from 'solid-js';
import { useParams } from '@solidjs/router';
import { keepPreviousData, useQuery } from '@tanstack/solid-query';
import { Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '@/modules/documents/components/documents-list.component';
import { fetchOrganizationDocuments } from '@/modules/documents/documents.services';
import { createParamSynchronizedPagination } from '@/modules/shared/pagination/query-synchronized-pagination';
import { fetchViews } from '../views.services';

export const ViewPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const [getPagination, setPagination] = createParamSynchronizedPagination();

  const viewsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'views'],
    queryFn: () => fetchViews({ organizationId: params.organizationId }),
  }));

  const getView = () => viewsQuery.data?.views.find(v => v.id === params.viewId);

  const documentsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', 'view', params.viewId, getPagination()],
    queryFn: () => fetchOrganizationDocuments({
      organizationId: params.organizationId,
      searchQuery: getView()?.query ?? '',
      ...getPagination(),
    }),
    enabled: Boolean(getView()),
    placeholderData: keepPreviousData,
  }));

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Suspense>
        <Show when={getView()}>
          {getViewData => (
            <>
              <div class="mb-6">
                <div class="flex items-center gap-2 mb-1">
                  <div class="i-tabler-layout-list size-5 text-muted-foreground" />
                  <h2 class="text-xl font-bold">{getViewData().name}</h2>
                </div>
                <code class="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{getViewData().query}</code>
              </div>

              <Show when={documentsQuery.data}>
                {getData => (
                  <DocumentsPaginatedList
                    documents={getData().documents}
                    documentsCount={getData().documentsCount}
                    getPagination={getPagination}
                    setPagination={setPagination}
                    extraColumns={[tagsColumn, createdAtColumn, standardActionsColumn]}
                  />
                )}
              </Show>

              <Show when={documentsQuery.data?.documentsCount === 0}>
                <div class="text-center py-16 text-muted-foreground">
                  <div class="i-tabler-file-off size-10 mx-auto mb-3 opacity-40" />
                  <p>{t('views.view.no-documents')}</p>
                </div>
              </Show>
            </>
          )}
        </Show>

        <Show when={!viewsQuery.isLoading && !getView()}>
          <div class="text-center py-16 text-muted-foreground">
            <div class="i-tabler-layout-list size-10 mx-auto mb-3 opacity-40" />
            <p>{t('views.view.not-found')}</p>
          </div>
        </Show>
      </Suspense>
    </div>
  );
};
