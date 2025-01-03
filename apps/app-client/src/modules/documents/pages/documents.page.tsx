import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { Badge } from '@/modules/ui/components/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
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
              <h2 class="text-xl font-bold mb-6">
                Latest imports
              </h2>
              <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
                {query[0].data?.documents.map(document => (
                  <div class="border rounded-lg overflow-hidden">
                    <div class="bg-card border-b flex items-center justify-center p-6">
                      <div class={cn(getDocumentIcon({ document }), 'size-16 text-muted-foreground')}></div>
                    </div>

                    <div class="p-4">

                      <Tooltip>
                        <TooltipTrigger class="w-full text-left">
                          <A
                            href={`/organizations/${params.organizationId}/documents/${document.id}`}
                            class="text-xs font-bold truncate block"
                          >
                            {document.name.split('.').shift()}
                          </A>
                        </TooltipTrigger>
                        <TooltipContent>
                          {document.name}
                        </TooltipContent>
                      </Tooltip>

                      <div class="text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" class="px-2">
                          {document.name.split('.').pop()?.toUpperCase()}
                        </Badge>
                        {' '}
                        -
                        {' '}
                        <Tooltip>
                          <TooltipTrigger>
                            {timeAgo({ date: document.createdAt })}
                          </TooltipTrigger>
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
