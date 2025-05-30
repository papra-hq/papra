import type { Component, JSX } from 'solid-js';
import type { DocumentActivity } from '../documents.types';
import { formatBytes, safely } from '@corentinth/chisels';
import { A, useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { createQueries, useInfiniteQuery } from '@tanstack/solid-query';
import { createEffect, createSignal, For, Match, Show, Suspense, Switch } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { downloadFile } from '@/modules/shared/files/download';
import { queryClient } from '@/modules/shared/query/query-client';
import { cn } from '@/modules/shared/style/cn';
import { DocumentTagPicker } from '@/modules/tags/components/tag-picker.component';
import { TagLink } from '@/modules/tags/components/tag.component';
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
import { useRenameDocumentDialog } from '../components/rename-document-button.component';
import { getDaysBeforePermanentDeletion, getDocumentActivityIcon } from '../document.models';
import { useDeleteDocument, useRestoreDocument } from '../documents.composables';
import { fetchDocument, fetchDocumentActivities, fetchDocumentFile, updateDocument } from '../documents.services';
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

const ActivityItem: Component<{ activity: DocumentActivity }> = (props) => {
  const { t, te } = useI18n();
  const params = useParams();

  return (
    <div class="border-b py-3 flex items-center gap-2">
      <div>
        <div class={cn(getDocumentActivityIcon({ event: props.activity.event }), 'size-6 text-muted-foreground')} />
      </div>
      <div>
        <Switch fallback={<span class="text-sm">{t(`activity.document.${props.activity.event}`)}</span>}>
          <Match when={['tagged', 'untagged'].includes(props.activity.event)}>
            <span class="text-sm flex items-baseline gap-1">
              {te(`activity.document.${props.activity.event}`, { tag: props.activity.tag ? <TagLink {...props.activity.tag} organizationId={params.organizationId} class="text-xs" /> : undefined })}
            </span>
          </Match>

          <Match when={props.activity.event === 'updated' && (props.activity.eventData.updatedFields as string[]).length === 1}>
            <span class="text-sm flex items-baseline gap-1">
              {te(`activity.document.updated.single`, {
                field: <span class="font-bold">{(props.activity.eventData.updatedFields as string[])[0]}</span>,
              })}
            </span>
          </Match>

          <Match when={props.activity.event === 'updated' && (props.activity.eventData.updatedFields as string[]).length > 1}>
            <span class="text-sm flex items-baseline gap-1">
              {te(`activity.document.updated.multiple`, { fields: (props.activity.eventData.updatedFields as string[]).join(', ') })}
            </span>
          </Match>

        </Switch>

        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <span title={props.activity.createdAt.toLocaleString()}>{timeAgo({ date: props.activity.createdAt })}</span>
          <Show when={props.activity.user}>
            {getUser => (
              <span>{te('activity.document.user.name', { name: <A href={`/organizations/${params.organizationId}/members`} class="underline hover:text-primary transition">{getUser().name}</A> })}</span>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
};

const tabs = ['info', 'content', 'activity'] as const;
type Tab = typeof tabs[number];

export const DocumentPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { deleteDocument } = useDeleteDocument();
  const { restore, getIsRestoring } = useRestoreDocument();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { openRenameDialog } = useRenameDocumentDialog();

  const getInitialTab = (): Tab => {
    const tab = searchParams.tab;
    if (tab && typeof tab === 'string' && tabs.includes(tab as Tab)) {
      return tab as Tab;
    }
    return 'info';
  };

  const [getTab, setTab] = createSignal<Tab>(getInitialTab());

  createEffect(() => {
    setSearchParams({ tab: getTab() }, { replace: true });
  });

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

  const activityPageSize = 20;
  const activityQuery = useInfiniteQuery(() => ({
    enabled: getTab() === 'activity',
    queryKey: ['organizations', params.organizationId, 'documents', params.documentId, 'activity'],
    queryFn: async ({ pageParam }) => {
      const { activities } = await fetchDocumentActivities({
        documentId: params.documentId,
        organizationId: params.organizationId,
        pageIndex: pageParam,
        pageSize: activityPageSize,
      });

      return activities;
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.length < activityPageSize) {
        return undefined;
      }

      return lastPageParam + 1;
    },
    initialPageParam: 0,
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
                  <Button
                    variant="ghost"
                    class="flex items-center gap-2 group bg-transparent! px-0"
                    onClick={() => openRenameDialog({
                      documentId: getDocument().id,
                      organizationId: params.organizationId,
                      documentName: getDocument().name,
                    })}
                  >
                    <h1 class="text-xl font-semibold">
                      {getDocument().name}
                    </h1>

                    <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors"></div>
                  </Button>
                  <p class="text-sm text-muted-foreground mb-6">{getDocument().id}</p>

                  <div class="flex gap-2 mb-2">
                    <Button
                      onClick={() => downloadFile({ fileName: getDocument().name, url: getDataUrl()! })}
                      variant="outline"
                      size="sm"
                    >
                      <div class="i-tabler-download size-4 mr-2"></div>
                      {t('documents.actions.download')}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => window.open(getDataUrl()!, '_blank')}
                      size="sm"
                    >
                      <div class="i-tabler-eye size-4 mr-2"></div>
                      {t('documents.actions.open-in-new-tab')}
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
                            {t('documents.actions.restore')}
                          </Button>
                        )
                      : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteDoc}
                          >
                            <div class="i-tabler-trash size-4 mr-2"></div>
                            {t('documents.actions.delete')}
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
                      {t('documents.deleted.message', { days: getDaysBeforePermanentDeletion({
                        document: getDocument(),
                        deletedDocumentsRetentionDays: config.documents.deletedDocumentsRetentionDays,
                      }) ?? 0 })}
                    </Alert>
                  )}

                  <Separator class="my-3" />

                  <Tabs value={getTab()} onChange={setTab} class="w-full">
                    <TabsList class="w-full h-8">
                      <TabsTrigger value="info">{t('documents.tabs.info')}</TabsTrigger>
                      <TabsTrigger value="content">{t('documents.tabs.content')}</TabsTrigger>
                      <TabsTrigger value="activity">{t('documents.tabs.activity')}</TabsTrigger>
                      <TabsIndicator />
                    </TabsList>

                    <TabsContent value="info">
                      <KeyValues data={[
                        {
                          label: t('documents.info.id'),
                          value: getDocument().id,
                          icon: 'i-tabler-id',
                        },
                        {
                          label: t('documents.info.name'),
                          value: (
                            <Button
                              variant="ghost"
                              class="flex items-center gap-2 group bg-transparent! p-0 h-auto"
                              onClick={() => openRenameDialog({
                                documentId: getDocument().id,
                                organizationId: params.organizationId,
                                documentName: getDocument().name,
                              })}
                            >
                              {getDocument().name}

                              <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors"></div>
                            </Button>
                          ),
                          icon: 'i-tabler-file-text',
                        },
                        {
                          label: t('documents.info.type'),
                          value: getDocument().mimeType,
                          icon: 'i-tabler-file-unknown',
                        },
                        {
                          label: t('documents.info.size'),
                          value: formatBytes({ bytes: getDocument().originalSize, base: 1000 }),
                          icon: 'i-tabler-weight',
                        },
                        {
                          label: t('documents.info.created-at'),
                          value: timeAgo({ date: getDocument().createdAt }),
                          icon: 'i-tabler-calendar',
                        },
                        {
                          label: t('documents.info.updated-at'),
                          value: getDocument().updatedAt ? timeAgo({ date: getDocument().updatedAt! }) : <span class="text-muted-foreground">{t('documents.info.never')}</span>,
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
                                {t('documents.actions.edit')}
                              </Button>
                            </div>

                            <Alert variant="muted" class="my-4 flex items-center gap-2">
                              <div class="i-tabler-info-circle size-8 flex-shrink-0" />
                              <AlertDescription>
                                {t('documents.content.alert')}
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
                              {t('documents.actions.cancel')}
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving()}>
                              {isSaving() ? t('documents.actions.saving') : t('documents.actions.save')}
                            </Button>
                          </div>
                        </div>
                      </Show>
                    </TabsContent>
                    <TabsContent value="activity">
                      <Show when={activityQuery.data?.pages}>
                        {getActivitiesPages => (
                          <div class="flex flex-col">
                            <For each={getActivitiesPages() ?? []}>
                              {activities => (
                                <For each={activities}>
                                  {activity => (
                                    <ActivityItem activity={activity} />
                                  )}
                                </For>
                              )}
                            </For>

                            <Show
                              when={activityQuery.hasNextPage}
                              fallback={(
                                <div class="text-sm text-muted-foreground text-center py-4">
                                  {t('activity.no-more-activities')}
                                </div>
                              )}
                            >
                              <Button
                                variant="outline"
                                onClick={() => activityQuery.fetchNextPage()}
                                isLoading={activityQuery.isFetchingNextPage}
                              >
                                {t('activity.load-more')}
                              </Button>
                            </Show>
                          </div>
                        )}
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
