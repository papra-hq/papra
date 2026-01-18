import type { Component } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import { keepPreviousData, useQuery } from '@tanstack/solid-query';
import { createEffect, createSignal, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { asSingleParam } from '@/modules/shared/utils/query-params';
import { useDebounce } from '@/modules/shared/utils/timing';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '../components/documents-list.component';
import { searchDocuments } from '../documents.services';

export const DocumentsPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [getSearchQuery, setSearchQuery] = createSignal<string>(asSingleParam(searchParams.query) ?? '');
  const debouncedSearchQuery = useDebounce(getSearchQuery, 300);
  const [getPagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 15 });

  const onSearchInput = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ query });
  };

  createEffect(() => {
    setSearchQuery(asSingleParam(searchParams.query) ?? '');
  });

  const documentsQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'documents', getPagination(), debouncedSearchQuery()],
    queryFn: () => searchDocuments({
      organizationId: params.organizationId,
      searchQuery: debouncedSearchQuery(),
      ...getPagination(),
    }),
    placeholderData: keepPreviousData,
  }));

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Suspense>
        {documentsQuery.data?.documents?.length === 0 && debouncedSearchQuery().length === 0
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

                <div class="flex items-center">
                  <TextFieldRoot class="max-w-md flex-1">
                    <TextField
                      type="search"
                      name="search"
                      placeholder={t('documents.list.search.placeholder')}
                      value={getSearchQuery()}
                      onInput={e => onSearchInput(e.currentTarget.value)}
                      class="pr-9"
                      autofocus
                    />
                  </TextFieldRoot>

                  <Show when={getSearchQuery().length > 0}>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-6 ml--8"
                      disabled={documentsQuery.isFetching}
                      onClick={() => onSearchInput('')}
                      aria-label={documentsQuery.isFetching ? 'Loading' : 'Clear search'}
                    >
                      <div
                        class={cn('text-muted-foreground', documentsQuery.isFetching ? 'i-tabler-loader-2 animate-spin' : 'i-tabler-x')}
                      />
                    </Button>
                  </Show>

                </div>
                <div class="mb-4 text-sm text-muted-foreground mt-2 ml-2">
                  <Show
                    when={debouncedSearchQuery().length > 0}
                    fallback={t('documents.list.search.total-count-no-query', { count: documentsQuery.data?.totalCount ?? 0 })}
                  >
                    {t('documents.list.search.total-count-with-query', { count: documentsQuery.data?.totalCount ?? 0 })}
                  </Show>
                </div>

                <Show when={debouncedSearchQuery().length > 0 && documentsQuery.data?.documents.length === 0}>
                  <p class="text-muted-foreground mt-1 mb-6">
                    {t('documents.list.no-results')}
                  </p>
                </Show>

                <DocumentsPaginatedList
                  documents={documentsQuery.data?.documents ?? []}
                  documentsCount={documentsQuery.data?.totalCount ?? 0}
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
