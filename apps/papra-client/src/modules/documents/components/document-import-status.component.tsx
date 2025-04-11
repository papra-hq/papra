import type { ParentComponent } from 'solid-js';
import type { Document } from '../documents.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { promptUploadFiles } from '@/modules/shared/files/upload';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { safely } from '@corentinth/chisels';
import { A } from '@solidjs/router';
import { throttle } from 'lodash-es';
import { createContext, createSignal, For, Match, Show, Switch, useContext } from 'solid-js';
import { Portal } from 'solid-js/web';
import { invalidateOrganizationDocumentsQuery } from '../documents.composables';
import { uploadDocument } from '../documents.services';

const DocumentUploadContext = createContext<{
  uploadDocuments: (args: { files: File[]; organizationId: string }) => Promise<void>;
}>();

export function useDocumentUpload({ organizationId }: { organizationId: string }) {
  const context = useContext(DocumentUploadContext);

  if (!context) {
    throw new Error('DocumentUploadContext not found');
  }

  const { uploadDocuments } = context;

  return {
    uploadDocuments: async ({ files }: { files: File[] }) => uploadDocuments({ files, organizationId }),
    promptImport: async () => {
      const { files } = await promptUploadFiles();

      await uploadDocuments({ files, organizationId });
    },
  };
}

type TaskSuccess = {
  file: File;
  status: 'success';
  document: Document;
};

type TaskError = {
  file: File;
  status: 'error';
  error: Error;
};

type Task = TaskSuccess | TaskError | {
  file: File;
  status: 'pending' | 'uploading' ;
};

export const DocumentUploadProvider: ParentComponent = (props) => {
  const throttledInvalidateOrganizationDocumentsQuery = throttle(invalidateOrganizationDocumentsQuery, 500);
  const { getErrorMessage } = useI18nApiErrors();
  const { t } = useI18n();

  const [getState, setState] = createSignal<'open' | 'closed' | 'collapsed'>('closed');
  const [getTasks, setTasks] = createSignal<Task[]>([]);

  const updateTaskStatus = (args: { file: File; status: 'success'; document: Document } | { file: File; status: 'error'; error: Error } | { file: File; status: 'pending' | 'uploading' }) => {
    setTasks(tasks => tasks.map(task => task.file === args.file ? { ...task, ...args } : task));
  };

  const uploadDocuments = async ({ files, organizationId }: { files: File[]; organizationId: string }) => {
    setTasks(tasks => [...tasks, ...files.map(file => ({ file, status: 'pending' } as const))]);
    setState('open');

    await Promise.all(files.map(async (file) => {
      updateTaskStatus({ file, status: 'uploading' });

      const [result, error] = await safely(uploadDocument({ file, organizationId }));

      if (error) {
        updateTaskStatus({ file, status: 'error', error });
      } else {
        const { document } = result;

        updateTaskStatus({ file, status: 'success', document });
      }

      await throttledInvalidateOrganizationDocumentsQuery({ organizationId });
    }));
  };

  const getTitle = () => {
    if (getTasks().length === 0) {
      return t('import-documents.title.none');
    }

    const successCount = getTasks().filter(task => task.status === 'success').length;
    const errorCount = getTasks().filter(task => task.status === 'error').length;
    const totalCount = getTasks().length;

    if (errorCount > 0) {
      return t('import-documents.title.error', { count: errorCount });
    }

    if (successCount === totalCount) {
      return t('import-documents.title.success', { count: successCount });
    }

    return t('import-documents.title.pending', { count: successCount, total: totalCount });
  };

  const close = () => {
    setState('closed');
    setTasks([]);
  };

  return (
    <DocumentUploadContext.Provider value={{ uploadDocuments }}>
      {props.children}

      <Portal>
        <Show when={getState() !== 'closed'}>
          <div class="fixed bottom-0 right-0 sm:right-20px w-full sm:w-400px bg-card border-l border-t border-r sm:rounded-t-xl shadow-lg">
            <div class="flex items-center gap-1 pl-6 pr-4 py-3 border-b">
              <h2 class="text-base font-bold flex-1">{getTitle()}</h2>

              <Button variant="ghost" size="icon" onClick={() => setState(state => state === 'open' ? 'collapsed' : 'open')}>
                <div class={cn('i-tabler-chevron-down size-5 transition-transform', getState() === 'collapsed' && 'rotate-180')} />
              </Button>

              <Button variant="ghost" size="icon" onClick={close}>
                <div class="i-tabler-x size-5"></div>
              </Button>

            </div>

            <Show when={getState() === 'open'}>
              <div class="flex flex-col overflow-y-auto h-[450px] pb-4">
                <For each={getTasks()}>
                  {task => (

                    <Switch>
                      <Match when={task.status === 'success'}>
                        <A
                          href={`/organizations/${(task as TaskSuccess).document.organizationId}/documents/${(task as TaskSuccess).document.id}`}
                          class="text-sm truncate min-w-0 flex items-center gap-4 min-h-48px group hover:bg-muted/50 transition-colors px-6 border-b border-border/80"
                        >
                          <div class="flex-1 truncate">
                            {task.file.name}
                          </div>

                          <div class="flex-none">
                            <div class="i-tabler-circle-check text-primary size-5.5 group-hover:hidden"></div>
                            <div class="i-tabler-arrow-right text-muted-foreground size-5.5 hidden group-hover:block"></div>
                          </div>
                        </A>
                      </Match>

                      <Match when={task.status === 'error'}>
                        <div class="text-sm truncate min-w-0 flex items-center gap-4 min-h-48px px-6 border-b border-border/80">
                          <div class="flex-1 truncate">
                            <div class="flex-1 truncate">{task.file.name}</div>

                            <div class="text-xs text-muted-foreground truncate text-red-500">
                              {getErrorMessage({ error: (task as TaskError).error })}
                            </div>
                          </div>

                          <div class="flex-none">
                            <div class="i-tabler-circle-x text-red-500 size-5.5"></div>
                          </div>
                        </div>
                      </Match>

                      <Match when={['pending', 'uploading'].includes(task.status)}>
                        <div class="text-sm truncate min-w-0 flex items-center gap-4 min-h-48px px-6 border-b border-border/80">
                          <div class="flex-1 truncate">
                            {task.file.name}
                          </div>

                          <div class="flex-none">
                            <div class="i-tabler-loader-2 animate-spin text-muted-foreground size-5.5"></div>
                          </div>
                        </div>
                      </Match>
                    </Switch>

                  )}
                </For>

                <Show when={getTasks().length === 0}>
                  <div class="flex flex-col items-center justify-center gap-2 h-full mb-10">
                    <div class="flex flex-col items-center justify-center gap-2 ">
                      <div class="i-tabler-file-import size-10 text-muted-foreground"></div>
                    </div>

                    <div class="text-sm text-muted-foreground text-center mt-2">
                      {t('import-documents.no-import-in-progress')}
                    </div>
                  </div>
                </Show>
              </div>

            </Show>

          </div>
        </Show>
      </Portal>
    </DocumentUploadContext.Provider>
  );
};
