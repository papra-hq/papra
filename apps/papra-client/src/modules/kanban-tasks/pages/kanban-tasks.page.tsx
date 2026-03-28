import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX, ValidComponent } from 'solid-js';
import type { KanbanTask, KanbanTaskStatus } from '../kanban-tasks.types';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { makeReturnVoidAsync } from '@/modules/shared/functions/void';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { createToast } from '@/modules/ui/components/sonner';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { KanbanColumn } from '../components/kanban-column.component';
import { createKanbanTask, deleteKanbanTask, fetchKanbanTasks, updateKanbanTask, updateKanbanTaskStatus } from '../kanban-tasks.services';

const TaskForm: Component<{
  onSubmit: (values: { title: string; description: string }) => Promise<unknown> | unknown;
  initialValues?: { title?: string; description?: string | null };
  submitButton: JSX.Element;
}> = (props) => {
  const { t } = useI18n();
  const { form, Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(props.onSubmit),
    schema: v.object({
      title: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('kanban.form.title.required')),
        v.maxLength(256, t('kanban.form.title.max-length')),
      ),
      description: v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(2048, t('kanban.form.description.max-length')),
      ),
    }),
    initialValues: {
      title: props.initialValues?.title ?? '',
      description: props.initialValues?.description ?? '',
    },
  });

  return (
    <Form>
      <Field name="title">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="title">{t('kanban.form.title.label')}</TextFieldLabel>
            <TextField type="text" id="title" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('kanban.form.title.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="description">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="description">
              {t('kanban.form.description.label')}
              <span class="font-normal ml-1 text-muted-foreground">{t('kanban.form.description.optional')}</span>
            </TextFieldLabel>
            <TextArea id="description" {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('kanban.form.description.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex flex-row-reverse mt-6">
        {props.submitButton}
      </div>
    </Form>
  );
};

const CreateTaskModal: Component<{
  children?: <T extends ValidComponent | HTMLElement>(props: DialogTriggerProps<T>) => JSX.Element;
  organizationId: string;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const createTaskMutation = useMutation(() => ({
    mutationFn: (data: { title: string; description: string }) => createKanbanTask({
      title: data.title,
      description: data.description || undefined,
      organizationId: props.organizationId,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'kanban-tasks'],
        refetchType: 'all',
      });

      createToast({
        message: t('kanban.create.success'),
        type: 'success',
      });

      setIsModalOpen(false);
    },
    onError: (error) => {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      {props.children && <DialogTrigger as={props.children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('kanban.create')}</DialogTitle>
        </DialogHeader>

        <TaskForm
          onSubmit={createTaskMutation.mutateAsync}
          submitButton={(
            <Button
              type="submit"
              isLoading={createTaskMutation.isPending}
              disabled={!getIsModalOpen()}
            >
              {t('kanban.create')}
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

const UpdateTaskModal: Component<{
  children: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
  task: KanbanTask;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const updateTaskMutation = useMutation(() => ({
    mutationFn: (data: { title: string; description: string }) => updateKanbanTask({
      title: data.title,
      description: data.description || undefined,
      organizationId: props.organizationId,
      taskId: props.task.id,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'kanban-tasks'],
        refetchType: 'all',
      });

      createToast({
        message: t('kanban.update.success'),
        type: 'success',
      });

      setIsModalOpen(false);
    },
    onError: (error) => {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('kanban.update')}</DialogTitle>
        </DialogHeader>

        <TaskForm
          onSubmit={updateTaskMutation.mutate}
          initialValues={props.task}
          submitButton={(
            <Button
              type="submit"
              isLoading={updateTaskMutation.isPending}
              disabled={!getIsModalOpen()}
            >
              {t('kanban.update')}
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

const columnConfig = [
  { status: 'todo' as KanbanTaskStatus, labelKey: 'kanban.columns.todo' as const, icon: 'i-tabler-circle-dashed', color: 'var(--muted-foreground)' },
  { status: 'in-progress' as KanbanTaskStatus, labelKey: 'kanban.columns.in-progress' as const, icon: 'i-tabler-progress', color: 'var(--primary)' },
  { status: 'done' as KanbanTaskStatus, labelKey: 'kanban.columns.done' as const, icon: 'i-tabler-circle-check', color: '#22c55e' },
];

export const KanbanTasksPage: Component = () => {
  const params = useParams();
  const { confirm } = useConfirmModal();
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const [draggedTask, setDraggedTask] = createSignal<KanbanTask | null>(null);
  const [editingTask, setEditingTask] = createSignal<KanbanTask | null>(null);

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'kanban-tasks'],
    queryFn: () => fetchKanbanTasks({ organizationId: params.organizationId }),
  }));

  const statusMutation = useMutation(() => ({
    mutationFn: ({ taskId, status, displayOrder }: { taskId: string; status: KanbanTaskStatus; displayOrder: number }) =>
      updateKanbanTaskStatus({
        organizationId: params.organizationId,
        taskId,
        status,
        displayOrder,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', params.organizationId, 'kanban-tasks'],
        refetchType: 'all',
      });
    },
    onError: (error) => {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  const handleDragStart = (e: DragEvent, task: KanbanTask) => {
    setDraggedTask(task);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    }
  };

  const handleDrop = (_e: DragEvent, newStatus: KanbanTaskStatus) => {
    const task = draggedTask();
    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    const tasksInColumn = getTasksByStatus(newStatus);
    const newOrder = tasksInColumn.length;

    statusMutation.mutate({
      taskId: task.id,
      status: newStatus,
      displayOrder: newOrder,
    });

    setDraggedTask(null);
  };

  const handleDelete = async (task: KanbanTask) => {
    const confirmed = await confirm({
      title: t('kanban.delete.confirm.title'),
      message: t('kanban.delete.confirm.message'),
      cancelButton: {
        text: t('kanban.delete.confirm.cancel-button'),
        variant: 'secondary',
      },
      confirmButton: {
        text: t('kanban.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(deleteKanbanTask({
      organizationId: params.organizationId,
      taskId: task.id,
    }));

    if (error) {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId, 'kanban-tasks'],
      refetchType: 'all',
    });

    createToast({
      message: t('kanban.delete.success'),
      type: 'success',
    });
  };

  const handleEdit = (task: KanbanTask) => {
    setEditingTask(task);
  };

  const getTasksByStatus = (status: KanbanTaskStatus) => {
    return (query.data?.tasks ?? []).filter(task => task.status === status);
  };

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-7xl">
      <Suspense>
        <div class="flex justify-between sm:items-center pb-6 gap-4 flex-col sm:flex-row">
          <div>
            <h2 class="text-xl font-bold">
              {t('kanban.title')}
            </h2>
            <p class="text-muted-foreground mt-1">
              {t('kanban.description')}
            </p>
          </div>

          <div class="flex-shrink-0">
            <CreateTaskModal organizationId={params.organizationId}>
              {props => (
                <Button class="w-full" {...props}>
                  <div class="i-tabler-plus size-4 mr-2" />
                  {t('kanban.create')}
                </Button>
              )}
            </CreateTaskModal>
          </div>
        </div>

        <Show when={query.data}>
          <div class="flex gap-4 overflow-x-auto pb-4">
            {columnConfig.map(col => (
              <KanbanColumn
                status={col.status}
                title={t(col.labelKey)}
                icon={col.icon}
                color={col.color}
                tasks={getTasksByStatus(col.status)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                headerAction={
                  col.status === 'todo'
                    ? (
                        <CreateTaskModal organizationId={params.organizationId}>
                          {props => (
                            <Button size="icon" variant="ghost" class="size-6" {...props}>
                              <div class="i-tabler-plus size-3.5" />
                            </Button>
                          )}
                        </CreateTaskModal>
                      )
                    : undefined
                }
              />
            ))}
          </div>
        </Show>

        <Show when={editingTask()}>
          {getTask => {
            const [getEditOpen, setEditOpen] = createSignal(true);

            const handleOpenChange = (open: boolean) => {
              setEditOpen(open);
              if (!open) {
                setEditingTask(null);
              }
            };

            return (
              <Dialog open={getEditOpen()} onOpenChange={handleOpenChange}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('kanban.update')}</DialogTitle>
                  </DialogHeader>

                  <TaskForm
                    onSubmit={async (values) => {
                      await updateKanbanTask({
                        title: values.title,
                        description: values.description || undefined,
                        organizationId: params.organizationId,
                        taskId: getTask().id,
                      });

                      await queryClient.invalidateQueries({
                        queryKey: ['organizations', params.organizationId, 'kanban-tasks'],
                        refetchType: 'all',
                      });

                      createToast({
                        message: t('kanban.update.success'),
                        type: 'success',
                      });

                      setEditingTask(null);
                    }}
                    initialValues={getTask()}
                    submitButton={(
                      <Button type="submit">
                        {t('kanban.update')}
                      </Button>
                    )}
                  />
                </DialogContent>
              </Dialog>
            );
          }}
        </Show>
      </Suspense>
    </div>
  );
};
