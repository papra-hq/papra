import type { Component, JSX } from 'solid-js';
import { formatBytes, safely } from '@corentinth/chisels';
import { useNavigate, useParams } from '@solidjs/router';
import { createQueries } from '@tanstack/solid-query';
import { createSignal, For, Show, Suspense } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { downloadFile } from '@/modules/shared/files/download';
import { queryClient } from '@/modules/shared/query/query-client';
import { DocumentTagPicker } from '@/modules/tags/components/tag-picker.component';
import { CreateTagModal } from '@/modules/tags/pages/tags.page';
import { addTagToDocument, removeTagFromDocument } from '@/modules/tags/tags.services';
import { Alert, AlertDescription } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { createToast } from '@/modules/ui/components/sonner';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/modules/ui/components/tabs';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextFieldRoot } from '@/modules/ui/components/textfield';
import { DocumentPreview } from '../components/document-preview.component';
import { getDaysBeforePermanentDeletion } from '../document.models';
import { useDeleteDocument, useRestoreDocument } from '../documents.composables';
import { fetchDocument, fetchDocumentFile, updateDocument } from '../documents.services';
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
  const { t } = useI18n();
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

  const [isEditing, setIsEditing] = createSignal(false);
  const [editedContent, setEditedContent] = createSignal('');
  const [isSaving, setIsSaving] = createSignal(false);

  const handleEdit = () => {
    setEditedContent(queries[0].data?.document.content ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const handleSave = async () => {
    if (!queries[0].data?.document) {
      return;
    }

    setIsSaving(true);
    const [, error] = await safely(updateDocument({
      documentId: queries[0].data.document.id,
      organizationId: params.organizationId,
      content: editedContent(),
    }));
    setIsSaving(false);
    setIsEditing(false);

    if (error) {
      createToast({ type: 'error', message: 'Failed to update document content' });
      return;
    }
    createToast({ type: 'success', message: 'Document content updated' });
    await queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId, 'documents', params.documentId],
    });
  };

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

                  <div class="flex gap-2 sm:items-center sm:flex-row flex-col">
                    <div class="flex-1">
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
                    </div>

                    <CreateTagModal organizationId={params.organizationId}>
                      {params => (
                        <Button variant="outline" {...params}>
                          <div class="i-tabler-plus size-4 mr-2"></div>
                          {t('tagging-rules.form.tags.add-tag')}
                        </Button>
                      )}
                    </CreateTagModal>
                  </div>

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

                  <Separator class="my-3" />

                  <Tabs defaultValue="info" class="w-full">
                    <TabsList class="w-full h-8">
                      <TabsTrigger value="info">Info</TabsTrigger>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsIndicator />
                    </TabsList>

                    <TabsContent value="info">
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
                    </TabsContent>
                    <TabsContent value="content">
                      <Show
                        when={isEditing()}
                        fallback={(
                          <div class="flex flex-col gap-2">
                            <div class="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                              {queries[0].data?.document.content}
                            </div>
                            <div class="flex justify-end">
                              <Button variant="outline" onClick={handleEdit}>
                                <div class="i-tabler-edit size-4 mr-2" />
                                Edit
                              </Button>
                            </div>

                            <Alert variant="muted" class="my-4 flex items-center gap-2">
                              <div class="i-tabler-info-circle size-8 flex-shrink-0" />
                              <AlertDescription>
                                The content of the document is automatically extracted from the document on upload. It is only used for search and indexing purposes.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      >
                        <div class="flex flex-col gap-2">
                          <TextFieldRoot>
                            <TextArea
                              value={editedContent()}
                              onInput={e => setEditedContent(e.currentTarget.value)}
                              class="font-mono min-h-[200px]"
                            />
                          </TextFieldRoot>
                          <div class="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancel} disabled={isSaving()}>
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving()}>
                              {isSaving() ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      </Show>
                    </TabsContent>
                  </Tabs>

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
