import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import type { Document } from '../documents.types';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { formatBytes } from '@corentinth/chisels';
import { A, useParams } from '@solidjs/router';
import { createQueries, keepPreviousData } from '@tanstack/solid-query';
import { type Component, createSignal, Suspense } from 'solid-js';
import { DocumentManagementDropdown } from '../components/document-management-dropdown.component';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '../components/documents-list.component';
import { getDocumentIcon } from '../document.models';
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
    ],
  }));

  return (
    <div class="p-6 mt-4 pb-32">
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
                <h2 class="text-lg font-semibold mb-4">
                  Latest imported documents
                </h2>
                <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {query[0].data?.documents.slice(0, 5).map(document => (
                    <DocumentCard document={document} />
                  ))}
                </div>

                <h2 class="text-lg font-semibold mt-8 mb-2">
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
