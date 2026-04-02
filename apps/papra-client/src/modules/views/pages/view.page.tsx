import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { useNavigate, useParams } from '@solidjs/router';
import { keepPreviousData, useQuery } from '@tanstack/solid-query';
import { Show, Suspense } from 'solid-js';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '@/modules/documents/components/documents-list.component';
import { fetchOrganizationDocuments } from '@/modules/documents/documents.services';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { createParamSynchronizedPagination } from '@/modules/shared/pagination/query-synchronized-pagination';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { UpdateViewModal } from '../components/view-modals';
import { deleteView, fetchView } from '../views.services';

export const ViewPage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const [getPagination, setPagination] = createParamSynchronizedPagination();

  const deleteViewConfirm = async () => {
    const confirmed = await confirm({
      title: t('views.delete.confirm.title'),
      message: t('views.delete.confirm.message'),
      cancelButton: { text: t('views.delete.confirm.cancel-button'), variant: 'secondary' },
      confirmButton: { text: t('views.delete.confirm.confirm-button'), variant: 'destructive' },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(deleteView({ organizationId: params.organizationId, viewId: params.viewId }));

    if (error) {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['organizations', params.organizationId, 'views'], refetchType: 'all' });
    createToast({ message: t('views.delete.success'), type: 'success' });
    navigate(`/organizations/${params.organizationId}/views`);
  };

  const viewQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'views', params.viewId],
    queryFn: () => fetchView({ organizationId: params.organizationId, viewId: params.viewId }),
  }));

  const documentsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', 'view', params.viewId, getPagination()],
    queryFn: () => fetchOrganizationDocuments({
      organizationId: params.organizationId,
      searchQuery: viewQuery.data?.view?.query ?? '',
      ...getPagination(),
    }),
    enabled: Boolean(viewQuery.data?.view),
    placeholderData: keepPreviousData,
  }));

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Suspense>
        <Show when={viewQuery.data?.view}>
          {getViewData => (
            <>
              <div class="mb-6">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <div class="flex items-center gap-2">
                    <div class="i-tabler-layout-list size-5 text-muted-foreground" />
                    <h2 class="text-xl font-bold">{getViewData().name}</h2>
                  </div>
                  <div class="flex gap-2">
                    <UpdateViewModal organizationId={params.organizationId} view={getViewData()}>
                      {props => (
                        <Button size="icon" variant="outline" {...props}>
                          <div class="i-tabler-edit size-4" />
                        </Button>
                      )}
                    </UpdateViewModal>
                    <Button size="icon" variant="outline" class="text-red" onClick={deleteViewConfirm}>
                      <div class="i-tabler-trash size-4" />
                    </Button>
                  </div>
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

        <Show when={!viewQuery.isLoading && !viewQuery.data?.view}>
          <div class="text-center py-16 text-muted-foreground">
            <div class="i-tabler-layout-list size-10 mx-auto mb-3 opacity-40" />
            <p>{t('views.view.not-found')}</p>
          </div>
        </Show>
      </Suspense>
    </div>
  );
};
