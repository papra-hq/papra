import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { formatBytes } from '@corentinth/chisels';
import { A, useParams } from '@solidjs/router';
import { createQueries, keepPreviousData } from '@tanstack/solid-query';
import { type Component, createSignal } from 'solid-js';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { getDocumentIcon } from '../document.models';
import { fetchOrganizationDocuments } from '../documents.services';

export const DocumentsPage: Component = () => {
  const [getPagination] = createSignal({ pageIndex: 0, pageSize: 100 });
  const params = useParams();

  const query = createQueries(() => ({
    queries: [
      {
        queryKey: ['organizations', params.organizationId, 'documents', { pageIndex: 0, pageSize: 100 }],
        queryFn: () => fetchOrganizationDocuments({
          organizationId: params.organizationId,
          ...getPagination(),
        }),
      },
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
                  <div class="border rounded-lg overflow-hidden flex gap-4 p-3 items-center">
                    <div class="bg-muted flex items-center justify-center p-2 rounded-lg">
                      <div class={cn(getDocumentIcon({ document }), 'size-6 text-muted-foreground')}></div>
                    </div>

                    <div class="flex-1 flex flex-col gap-1 truncate">
                      <A
                        href={`/organizations/${params.organizationId}/documents/${document.id}`}
                        class="text-xs font-bold truncate block hover:underline"
                      >
                        {document.name.split('.').shift()}
                      </A>

                      <div class="text-xs text-muted-foreground lh-none">
                        {formatBytes({ bytes: document.size, base: 1000 })}
                        {' '}
                        -
                        {' '}
                        {document.name.split('.').pop()?.toUpperCase()}
                        {' '}
                        -
                        {' '}
                        <Tooltip>
                          <TooltipTrigger as={(props: TooltipTriggerProps) => (
                            <span {...props}>
                              {timeAgo({ date: document.createdAt })}
                            </span>
                          )}
                          />
                          <TooltipContent>
                            {document.createdAt.toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </>

          )}
    </div>
  );
};
