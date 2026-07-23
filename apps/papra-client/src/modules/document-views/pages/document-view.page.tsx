import type { DropdownMenuSubTriggerProps } from '@kobalte/core/dropdown-menu';
import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { useNavigate, useParams } from '@solidjs/router';
import { keepPreviousData, useQuery } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import {
  createdAtColumn,
  documentDateColumn,
  DocumentsPaginatedList,
  standardActionsColumn,
  tagsColumn,
} from '@/modules/documents/components/documents-list.component';
import { fetchOrganizationDocuments } from '@/modules/documents/documents.services';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { createParamSynchronizedPagination } from '@/modules/shared/pagination/query-synchronized-pagination';
import { buildLocalStorageKey } from '@/modules/shared/signals/persistence/persistence.models';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/ui/components/dropdown-menu';
import { createToast } from '@/modules/ui/components/sonner';
import { UpdateDocumentViewModal } from '../components/document-view-modals';
import { deleteDocumentView, fetchDocumentView } from '../document-views.services';

export const DocumentViewPage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const [getPagination, setPagination] = createParamSynchronizedPagination({
    localStorageKey: buildLocalStorageKey('document-views', 'pageSize'),
  });
  const [getIsUpdateOpen, setIsUpdateOpen] = createSignal(false);

  const deleteDocumentViewConfirm = async () => {
    const confirmed = await confirm({
      title: t('document-views.delete.confirm.title'),
      message: t('document-views.delete.confirm.message'),
      cancelButton: {
        text: t('document-views.delete.confirm.cancel-button'),
        variant: 'secondary',
      },
      confirmButton: {
        text: t('document-views.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(
      deleteDocumentView({
        organizationId: params.organizationId,
        documentViewId: params.documentViewId,
      }),
    );

    if (error) {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId, 'document-views'],
      refetchType: 'all',
    });
    createToast({ message: t('document-views.delete.success'), type: 'success' });
    navigate(`/organizations/${params.organizationId}`);
  };

  const documentViewQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'document-views', params.documentViewId],
    queryFn: async () =>
      fetchDocumentView({
        organizationId: params.organizationId,
        documentViewId: params.documentViewId,
      }),
  }));

  const documentsQuery = useQuery(() => ({
    queryKey: [
      'organizations',
      params.organizationId,
      'documents',
      'document-view',
      params.documentViewId,
      documentViewQuery.data?.documentView?.query ?? '',
      getPagination(),
    ],
    queryFn: async () =>
      fetchOrganizationDocuments({
        organizationId: params.organizationId,
        searchQuery: documentViewQuery.data?.documentView?.query ?? '',
        ...getPagination(),
      }),
    enabled: Boolean(documentViewQuery.data?.documentView),
    placeholderData: keepPreviousData,
  }));

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Suspense>
        <Show when={documentViewQuery.data?.documentView}>
          {(getDocumentView) => (
            <>
              <div class="mb-6">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <div class="flex items-center gap-2">
                    <div class="i-tabler-layout-list size-5 text-muted-foreground" />
                    <h2 class="text-xl font-bold">{getDocumentView().name}</h2>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      as={(triggerProps: DropdownMenuSubTriggerProps) => (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('document-views.actions.menu')}
                          {...triggerProps}
                        >
                          <div class="i-tabler-dots-vertical size-4" />
                        </Button>
                      )}
                    />
                    <DropdownMenuContent class="w-48">
                      <DropdownMenuItem
                        class="cursor-pointer"
                        onClick={() => setIsUpdateOpen(true)}
                      >
                        <div class="i-tabler-edit size-4 mr-2" />
                        <span>{t('document-views.update')}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        class="cursor-pointer text-red"
                        onClick={deleteDocumentViewConfirm}
                      >
                        <div class="i-tabler-trash size-4 mr-2" />
                        <span>{t('document-views.delete')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <code class="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                  {getDocumentView().query}
                </code>
                <Show when={getDocumentView().description}>
                  {(getDescription) => (
                    <p class="text-sm text-muted-foreground mt-2">{getDescription()}</p>
                  )}
                </Show>
              </div>

              <UpdateDocumentViewModal
                organizationId={params.organizationId}
                documentView={getDocumentView()}
                open={getIsUpdateOpen()}
                onOpenChange={setIsUpdateOpen}
              />

              <Show when={documentsQuery.data}>
                {(getData) => (
                  <DocumentsPaginatedList
                    documents={getData().documents}
                    documentsCount={getData().documentsCount}
                    getPagination={getPagination}
                    setPagination={setPagination}
                    extraColumns={[
                      tagsColumn,
                      documentDateColumn,
                      createdAtColumn,
                      standardActionsColumn,
                    ]}
                  />
                )}
              </Show>

              <Show when={documentsQuery.data?.documentsCount === 0}>
                <div class="text-center py-16 text-muted-foreground">
                  <div class="i-tabler-file-off size-10 mx-auto mb-3 opacity-40" />
                  <p>{t('document-views.view.no-documents')}</p>
                </div>
              </Show>
            </>
          )}
        </Show>

        <Show when={!documentViewQuery.isLoading && !documentViewQuery.data?.documentView}>
          <div class="text-center py-16 text-muted-foreground">
            <div class="i-tabler-layout-list size-10 mx-auto mb-3 opacity-40" />
            <p>{t('document-views.view.not-found')}</p>
          </div>
        </Show>
      </Suspense>
    </div>
  );
};
