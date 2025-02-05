import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import type { Document } from '../documents.types';
import { fetchOrganization } from '@/modules/organizations/organizations.services';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { formatBytes } from '@corentinth/chisels';
import { A, useParams } from '@solidjs/router';
import { createQueries, keepPreviousData } from '@tanstack/solid-query';
import { type Component, createSignal, For, Show, Suspense } from 'solid-js';
import { DocumentManagementDropdown } from '../components/document-management-dropdown.component';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '../components/documents-list.component';
import { getDocumentIcon } from '../document.models';
import { useUploadDocuments } from '../documents.composables';
import { fetchOrganizationDocuments } from '../documents.services';

const DocumentCard: Component<{ document: Document; organizationId?: string }> = (props) => {
  const params = useParams();

  const getOrganizationId = () => props.organizationId ?? params.organizationId;

  return (
    <div class="border rounded-lg overflow-hidden flex gap-4 p-3 pr-2 items-center">
      <div class="bg-muted flex items-center justify-center p-2 rounded-lg">
        <div class={cn(getDocumentIcon({ document: props.document }), 'size-6 text-primary')}></div>
      </div>

      <div class="flex-1 flex flex-col gap-1 truncate">
        <A
          href={`/organizations/${getOrganizationId()}/documents/${props.document.id}`}
          class="font-bold truncate block hover:underline"
        >
          {props.document.name.split('.').shift()}
        </A>

        <div class="text-xs text-muted-foreground lh-tight">
          {formatBytes({ bytes: props.document.originalSize, base: 1000 })}
          {' '}
          -
          {' '}
          {props.document.name.split('.').pop()?.toUpperCase()}
          {' '}
          -
          {' '}
          <Tooltip>
            <TooltipTrigger as={(tooltipProps: TooltipTriggerProps) => (
              <span {...tooltipProps}>
                {timeAgo({ date: props.document.createdAt })}
              </span>
            )}
            />
            <TooltipContent>
              {props.document.createdAt.toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div>
        <DocumentManagementDropdown document={props.document} />
      </div>
    </div>
  );
};

export const DocumentsPage: Component = () => {
  const params = useParams();
  const [getPagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 100 });

  const query = createQueries(() => ({
    queries: [
      {
        queryKey: ['organizations', params.organizationId, 'documents', getPagination()],
        queryFn: () => fetchOrganizationDocuments({
          organizationId: params.organizationId,
          ...getPagination(),
        }),
        placeholderData: keepPreviousData,
      },
      {
        queryKey: ['organizations', params.organizationId],
        queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
      },
    ],
  }));

  const { promptImport } = useUploadDocuments({ organizationId: params.organizationId });

  return (
    <div class="p-6 mt-4 pb-32 max-w-7xl mx-auto">
      <Suspense>
        {query[0].data?.documents?.length === 0
          ? (
              <>
                <h2 class="text-xl font-bold ">
                  No documents
                </h2>

                <p class="text-muted-foreground mt-1 mb-6">
                  There are no documents in this organization yet. Start by uploading some documents.
                </p>

                <DocumentUploadArea />

              </>
            )
          : (
              <>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">

                  <Button onClick={promptImport} class="h-auto items-start flex-col gap-4 py-4 px-6">
                    <div class="i-tabler-upload size-6"></div>

                    Upload documents
                  </Button>

                  <Show when={query[1].data?.organization}>
                    {organization => (
                      <>
                        <div class="border rounded-lg p-2 flex items-center gap-4 py-4 px-6">
                          <div class="flex gap-2 items-baseline">
                            <span class="font-light text-2xl">
                              {organization().documentsCount}
                            </span>
                            <span class="text-muted-foreground">
                              documents in total
                            </span>
                          </div>
                        </div>

                        <div class="border rounded-lg p-2 flex items-center gap-4 py-4 px-6">
                          <div class="flex gap-2 items-baseline">
                            <span class="font-light text-2xl">
                              {formatBytes({ bytes: organization().documentsSize, base: 1000 })}
                            </span>
                            <span class="text-muted-foreground">
                              total size
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </Show>
                </div>

                <h2 class="text-lg font-semibold mb-4">
                  Latest imported documents
                </h2>
                <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  <For each={query[0].data?.documents.slice(0, 5)}>
                    {document => (
                      <DocumentCard document={document} />
                    )}
                  </For>
                </div>

                <h2 class="text-lg font-semibold mt-12 mb-2">
                  All documents
                </h2>

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
