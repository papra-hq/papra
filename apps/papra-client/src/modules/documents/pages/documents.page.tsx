import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { formatBytes } from '@corentinth/chisels';
import { A, useParams } from '@solidjs/router';
import { createQueries } from '@tanstack/solid-query';
import { DocumentManagementDropdown } from '../components/document-management-dropdown.component';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { DocumentsPaginatedList } from '../components/documents-paginated-list.component';
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
          {formatBytes({ bytes: props.document.size, base: 1000 })}
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
        <DocumentManagementDropdown documentId={props.document.id} organizationId={getOrganizationId()} />
      </div>
    </div>
  );
};

export const DocumentsPage: Component = () => {
  const params = useParams();

  const query = createQueries(() => ({
    queries: [
      {
        queryKey: ['organizations', params.organizationId, 'documents', { pageIndex: 0, pageSize: 100 }],
        queryFn: () => fetchOrganizationDocuments({
          organizationId: params.organizationId,
          pageIndex: 0,
          pageSize: 5,
        }),
      },
    ],
  }));

  return (
    <div class="p-6  mt-4 pb-32">

      {query[0].data?.documents.length === 0
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
              <div class="grid gap-4 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
                {query[0].data?.documents.map(document => (
                  <DocumentCard document={document} />
                ))}
              </div>

              <h2 class="text-lg font-semibold mt-8 mb-2">
                All documents
              </h2>

              <DocumentsPaginatedList organizationId={params.organizationId} />
            </>

          )}
    </div>
  );
};
