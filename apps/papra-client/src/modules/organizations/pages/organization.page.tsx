import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { keepPreviousData, useQuery } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import { useDocumentUpload } from '@/modules/documents/components/document-import-status.component';
import { DocumentUploadArea } from '@/modules/documents/components/document-upload-area.component';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '@/modules/documents/components/documents-list.component';
import { fetchOrganizationDocuments, getOrganizationDocumentsStats } from '@/modules/documents/documents.services';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';

export const OrganizationPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const [getPagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 100 });

  const documentsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', getPagination()],
    queryFn: () => fetchOrganizationDocuments({
      organizationId: params.organizationId,
      ...getPagination(),
    }),
    placeholderData: keepPreviousData,
  }));

  const statsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', 'stats'],
    queryFn: () => getOrganizationDocumentsStats({ organizationId: params.organizationId }),
  }));

  const { promptImport } = useDocumentUpload();

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Suspense>
        {documentsQuery.data?.documents?.length === 0
          ? (
              <>
                <h2 class="text-xl font-bold ">
                  {t('organizations.details.no-documents.title')}
                </h2>

                <p class="text-muted-foreground mt-1 mb-6">
                  {t('organizations.details.no-documents.description')}
                </p>

                <DocumentUploadArea />

              </>
            )
          : (
              <>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">

                  <Button onClick={promptImport} class="h-auto items-start flex-col gap-4 py-4 px-6 text-left">
                    <div class="i-tabler-upload size-6" />

                    {t('organizations.details.upload-documents')}
                  </Button>

                  <Show when={statsQuery.data?.organizationStats}>
                    {organizationStats => (
                      <>
                        <div class="border rounded-lg p-2 flex items-center gap-4 py-4 px-6">
                          <div class="flex gap-2 items-baseline">
                            <span class="font-light text-2xl">
                              {organizationStats().documentsCount}
                            </span>
                            <span class="text-muted-foreground">
                              {t('organizations.details.documents-count')}
                            </span>
                          </div>
                        </div>

                        <div class="border rounded-lg p-2 flex items-center gap-4 py-4 px-6">
                          <div class="flex gap-2 items-baseline">
                            <span class="font-light text-2xl">
                              {formatBytes({ bytes: organizationStats().documentsSize, base: 1000 })}
                            </span>
                            <span class="text-muted-foreground">
                              {t('organizations.details.total-size')}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </Show>
                </div>

                <h2 class="text-lg font-semibold mb-4">
                  {t('organizations.details.latest-documents')}
                </h2>

                <DocumentsPaginatedList
                  documents={documentsQuery.data?.documents ?? []}
                  documentsCount={documentsQuery.data?.documentsCount ?? 0}
                  getPagination={getPagination}
                  setPagination={setPagination}
                  extraColumns={[
                    tagsColumn,
                    createdAtColumn,
                    standardActionsColumn,
                  ]}
                />
              </>
            )}
      </Suspense>
    </div>
  );
};
