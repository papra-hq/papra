import { useConfig } from '@/modules/config/config.provider';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { downloadFile } from '@/modules/shared/files/download';
import { DocumentTagPicker } from '@/modules/tags/components/tag-picker.component';
import { addTagToDocument, removeTagFromDocument } from '@/modules/tags/tags.services';
import { Alert } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { formatBytes } from '@corentinth/chisels';
import { useNavigate, useParams } from '@solidjs/router';
import { createQueries } from '@tanstack/solid-query';
import { type Component, For, type JSX, Show, Suspense } from 'solid-js';
import { DocumentPreview } from '../components/document-preview.component';
import { getDaysBeforePermanentDeletion } from '../document.models';
import { useDeleteDocument, useRestoreDocument } from '../documents.composables';
import { fetchDocument, fetchDocumentFile } from '../documents.services';
import '@pdfslick/solid/dist/pdf_viewer.css';

type KeyValueItem = {
  label: string | JSX.Element;
  value: string | JSX.Element;
  icon?: string;
};

const KeyValues: Component<{ data?: KeyValueItem[] }> = (props) => {
  return (
    <div class="flex flex-col gap-2">
      <table>
        <For each={props.data}>
          {item => (
            <tr>
              <td class="py-1 pr-2 text-sm text-muted-foreground flex items-center gap-2">
                {item.icon && <div class={item.icon}></div>}
                {item.label}
              </td>
              <td class="py-1 pl-2 text-sm">{item.value}</td>
            </tr>
          )}
        </For>
      </table>
    </div>
  );
};

export const DocumentPage: Component = () => {
  const params = useParams();
  const { deleteDocument } = useDeleteDocument();
  const { restore, getIsRestoring } = useRestoreDocument();
  const navigate = useNavigate();
  const { config } = useConfig();

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

  const deleteDoc = async () => {
    if (!queries[0].data) {
      return;
    }

    const { hasDeleted } = await deleteDocument({
      documentId: params.documentId,
      organizationId: params.organizationId,
      documentName: queries[0].data.document.name,
    });

    if (!hasDeleted) {
      return;
    }

    navigate(`/organizations/${params.organizationId}/documents`);
  };

  const getDataUrl = () => queries[1].data ? URL.createObjectURL(queries[1].data) : undefined;

  return (
    <div class="p-6 flex gap-6 h-full flex-col md:flex-row max-w-7xl mx-auto">
      <Suspense>
        <div class="md:flex-1 md:border-r">
          <Show when={queries[0].data?.document}>
            {getDocument => (
              <div class="flex gap-4 md:pr-6">
                <div class="flex-1">
                  <h1 class="text-xl font-semibold">{getDocument().name}</h1>
                  <p class="text-sm text-muted-foreground mb-6">{getDocument().id}</p>

                  <div class="flex gap-2 mb-2">
                    <Button
                      onClick={() => downloadFile({ fileName: getDocument().name, url: getDataUrl()! })}
                      variant="outline"
                      size="sm"
                    >
                      <div class="i-tabler-download size-4 mr-2"></div>
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => window.open(getDataUrl()!, '_blank')}
                      size="sm"
                    >
                      <div class="i-tabler-eye size-4 mr-2"></div>
                      Open in new tab
                    </Button>

                    {getDocument().isDeleted
                      ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => restore({ document: getDocument() })}
                            isLoading={getIsRestoring()}
                          >
                            <div class="i-tabler-refresh size-4 mr-2"></div>
                            Restore
                          </Button>
                        )
                      : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteDoc}
                          >
                            <div class="i-tabler-trash size-4 mr-2"></div>
                            Delete
                          </Button>
                        )}
                  </div>

                  <DocumentTagPicker
                    organizationId={params.organizationId}
                    tagIds={getDocument().tags.map(tag => tag.id)}
                    onTagAdded={async ({ tag }) => {
                      await addTagToDocument({
                        documentId: params.documentId,
                        organizationId: params.organizationId,
                        tagId: tag.id,
                      });
                    }}

                    onTagRemoved={async ({ tag }) => {
                      await removeTagFromDocument({
                        documentId: params.documentId,
                        organizationId: params.organizationId,
                        tagId: tag.id,
                      });
                    }}
                  />

                  {getDocument().isDeleted && (
                    <Alert variant="destructive" class="mt-6">
                      This document has been deleted and will be permanently removed in
                      {' '}
                      {getDaysBeforePermanentDeletion({
                        document: getDocument(),
                        deletedDocumentsRetentionDays: config.documents.deletedDocumentsRetentionDays,
                      })}
                      {' '}
                      days.
                    </Alert>
                  )}

                  <Separator class="my-6" />

                  <KeyValues data={[
                    {
                      label: 'ID',
                      value: getDocument().id,
                      icon: 'i-tabler-id',
                    },
                    {
                      label: 'Name',
                      value: getDocument().name,
                      icon: 'i-tabler-file-text',
                    },
                    {
                      label: 'Type',
                      value: getDocument().mimeType,
                      icon: 'i-tabler-file-unknown',
                    },
                    {
                      label: 'Size',
                      value: formatBytes({ bytes: getDocument().originalSize, base: 1000 }),
                      icon: 'i-tabler-weight',
                    },
                    {
                      label: 'Created At',
                      value: timeAgo({ date: getDocument().createdAt }),
                      icon: 'i-tabler-calendar',
                    },
                    {
                      label: 'Updated At',
                      value: getDocument().updatedAt ? timeAgo({ date: getDocument().updatedAt! }) : <span class="text-muted-foreground">Never</span>,
                      icon: 'i-tabler-calendar',
                    },
                  ]}
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
