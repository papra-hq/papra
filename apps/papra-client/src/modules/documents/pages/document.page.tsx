import { timeAgo } from '@/modules/shared/date/time-ago';
import { downloadFile } from '@/modules/shared/files/download';
import { Button } from '@/modules/ui/components/button';
import { useParams } from '@solidjs/router';
import { createQueries } from '@tanstack/solid-query';
import { type Component, Show, Suspense } from 'solid-js';
import { DocumentPreview } from '../components/document-preview.component';
import { fetchDocument, fetchDocumentFile } from '../documents.services';
import '@pdfslick/solid/dist/pdf_viewer.css';

const KeyValues: Component<{ data: Record<string, any> }> = (props) => {
  return (
    <div class="flex flex-col gap-2">
      <table>
        {Object.entries(props.data).map(([key, value]) => (
          <tr>
            <td class="py-1 pr-2 text-sm text-muted-foreground">{key}</td>
            <td class="py-1 pl-2 text-sm">{value}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

export const DocumentPage: Component = () => {
  const params = useParams();

  const queries = createQueries(() => ({
    queries: [
      {
        queryKey: ['organizations', params.organizationId, 'documents', params.documentId],
        queryFn: () => fetchDocument({ documentId: params.documentId, organizationId: params.organizationId }),
      },
      {
        queryKey: ['organizations', params.organizationId, 'documents', params.documentId, 'file'],
        queryFn: () => fetchDocumentFile({ documentId: params.documentId, organizationId: params.organizationId }),
      },
    ],
  }));

  const getDataUrl = () => queries[1].data ? URL.createObjectURL(queries[1].data) : undefined;

  return (
    <div class="p-6 flex gap-6 h-full flex-col md:flex-row">
      <Suspense>
        <div class="md:flex-1">
          <Show when={queries[0].data?.document}>
            {getDocument => (
              <div class="flex gap-4">
                <div class="flex-1">
                  <h1 class="text-xl font-semibold">{getDocument().name}</h1>
                  <p class="text-sm text-muted-foreground mb-6">{getDocument().id}</p>
                  <Button
                    onClick={() => downloadFile({
                      fileName: getDocument().name,
                      url: getDataUrl()!,
                    })}
                    variant="default"
                    class="mb-4"
                  >
                    <div class="i-tabler-download mr-2"></div>
                    Download
                  </Button>

                  <KeyValues data={{
                    'ID': getDocument().id,
                    'Name': getDocument().name,
                    'Created At': timeAgo({ date: getDocument().createdAt }),
                    'Updated At': getDocument().updatedAt ? timeAgo({ date: getDocument().updatedAt! }) : <span class="text-muted-foreground">Never</span>,
                  }}
                  />
                </div>
              </div>
            )}
          </Show>
        </div>

        <div class="flex-1 min-h-50vh">
          <Show when={queries[0].data?.document}>
            {getDocument => (
              <DocumentPreview document={getDocument()} />
            )}
          </Show>
        </div>
      </Suspense>
    </div>
  );
};
