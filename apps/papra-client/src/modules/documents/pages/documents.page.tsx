import { fetchOrganization } from '@/modules/organizations/organizations.services';
import { useParams } from '@solidjs/router';
import { createQueries, keepPreviousData } from '@tanstack/solid-query';
import { type Component, createSignal, Suspense } from 'solid-js';
import { DocumentUploadArea } from '../components/document-upload-area.component';
import { createdAtColumn, DocumentsPaginatedList, standardActionsColumn, tagsColumn } from '../components/documents-list.component';
import { fetchOrganizationDocuments } from '../documents.services';

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

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
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
                  Documents
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
