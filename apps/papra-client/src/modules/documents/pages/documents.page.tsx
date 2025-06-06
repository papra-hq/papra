import type { Component } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import { createQueries, keepPreviousData } from '@tanstack/solid-query';
import { castArray } from 'lodash-es';
import { createSignal, For, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganization } from '@/modules/organizations/organizations.services';
import { Tag } from '@/modules/tags/components/tag.component';
import { fetchTags } from '@/modules/tags/tags.services';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '../components/documents-list.component';
import { fetchOrganizationDocuments } from '../documents.services';

export const DocumentsPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [getPagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 100 });

  const getFiltererTagIds = () => searchParams.tags ? castArray(searchParams.tags) : [];

  const query = createQueries(() => ({
    queries: [
      {
        queryKey: ['organizations', params.organizationId, 'documents', getPagination(), getFiltererTagIds()],
        queryFn: () => fetchOrganizationDocuments({
          organizationId: params.organizationId,
          ...getPagination(),
          filters: {
            tags: getFiltererTagIds(),
          },
        }),
        placeholderData: keepPreviousData,
      },
      {
        queryKey: ['organizations', params.organizationId],
        queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
      },
      {
        queryKey: ['organizations', params.organizationId, 'tags'],
        queryFn: () => fetchTags({ organizationId: params.organizationId }),
      },
    ],
  }));

  const getFilteredTags = () => query[2].data?.tags.filter(tag => getFiltererTagIds().includes(tag.id)) ?? [];
  const hasFilters = () => getFiltererTagIds().length > 0;

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Suspense>
        {query[0].data?.documents?.length === 0 && !hasFilters()
          ? (
              <>
                <h2 class="text-xl font-bold ">
                  {t('documents.list.no-documents.title')}
                </h2>

                <p class="text-muted-foreground mt-1 mb-6">
                  {t('documents.list.no-documents.description')}
                </p>

                <DocumentUploadArea />

              </>
            )
          : (
              <>
                <h2 class="text-lg font-semibold mb-4">
                  {t('documents.list.title')}
                </h2>
                <Show when={hasFilters()}>
                  <div class="flex flex-wrap gap-2 mb-4">
                    <For each={getFilteredTags()}>
                      {tag => (
                        <Tag
                          {...tag}
                          closable
                          onClose={() => setSearchParams({ tags: getFiltererTagIds().filter(id => id !== tag.id) })}
                        />
                      )}
                    </For>
                  </div>
                </Show>

                <Show when={hasFilters() && query[0].data?.documentsCount === 0}>
                  <p class="text-muted-foreground mt-1 mb-6">
                    {t('documents.list.no-results')}
                  </p>
                </Show>

                <DocumentsPaginatedList
                  documents={query[0].data?.documents ?? []}
                  documentsCount={query[0].data?.documentsCount ?? 0}
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
