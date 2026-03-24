import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX, ValidComponent } from 'solid-js';
import type { View } from '../views.types';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSignal, For, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { makeReturnVoidAsync } from '@/modules/shared/functions/void';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { createView, deleteView, fetchViews, updateView } from '../views.services';

const ViewForm: Component<{
  onSubmit: (values: { name: string; query: string }) => Promise<unknown> | unknown;
  initialValues?: { name?: string; query?: string };
  submitButton: JSX.Element;
}> = (props) => {
  const { t } = useI18n();
  const { form, Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(props.onSubmit),
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('views.form.name.required')),
        v.maxLength(100, t('views.form.name.max-length')),
      ),
      query: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('views.form.query.required')),
        v.maxLength(500, t('views.form.query.max-length')),
      ),
    }),
    initialValues: props.initialValues,
  });

  return (
    <Form>
      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="name">{t('views.form.name.label')}</TextFieldLabel>
            <TextField type="text" id="name" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('views.form.name.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="query">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="query">{t('views.form.query.label')}</TextFieldLabel>
            <TextField type="text" id="query" {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('views.form.query.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            <div class="text-xs text-muted-foreground">{t('views.form.query.hint')}</div>
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex justify-end mt-6">
        {props.submitButton}
      </div>
    </Form>
  );
};

const CreateViewModal: Component<{
  children?: <T extends ValidComponent | HTMLElement>(props: DialogTriggerProps<T>) => JSX.Element;
  organizationId: string;
}> = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const mutation = useMutation(() => ({
    mutationFn: (data: { name: string; query: string }) => createView({
      organizationId: props.organizationId,
      name: data.name,
      query: data.query,
    }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', props.organizationId, 'views'], refetchType: 'all' });
      createToast({ message: t('views.create.success', { name: variables.name }), type: 'success' });
      setIsOpen(false);
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  return (
    <Dialog open={getIsOpen()} onOpenChange={setIsOpen}>
      {props.children && <DialogTrigger as={props.children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('views.create')}</DialogTitle>
        </DialogHeader>
        <ViewForm
          onSubmit={mutation.mutateAsync}
          submitButton={(
            <Button type="submit" isLoading={mutation.isPending} disabled={!getIsOpen()}>
              {t('views.create')}
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

const UpdateViewModal: Component<{
  children: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
  view: View;
}> = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const mutation = useMutation(() => ({
    mutationFn: (data: { name: string; query: string }) => updateView({
      organizationId: props.organizationId,
      viewId: props.view.id,
      name: data.name,
      query: data.query,
    }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', props.organizationId, 'views'], refetchType: 'all' });
      createToast({ message: t('views.update.success', { name: variables.name }), type: 'success' });
      setIsOpen(false);
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  return (
    <Dialog open={getIsOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('views.update')}</DialogTitle>
        </DialogHeader>
        <ViewForm
          onSubmit={mutation.mutate}
          initialValues={props.view}
          submitButton={(
            <Button type="submit" isLoading={mutation.isPending} disabled={!getIsOpen()}>
              {t('views.update')}
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

export const ViewsPage: Component = () => {
  const params = useParams();
  const { confirm } = useConfirmModal();
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'views'],
    queryFn: () => fetchViews({ organizationId: params.organizationId }),
  }));

  const del = async ({ view }: { view: View }) => {
    const confirmed = await confirm({
      title: t('views.delete.confirm.title'),
      message: t('views.delete.confirm.message'),
      cancelButton: { text: t('views.delete.confirm.cancel-button'), variant: 'secondary' },
      confirmButton: { text: t('views.delete.confirm.confirm-button'), variant: 'destructive' },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(deleteView({ organizationId: params.organizationId, viewId: view.id }));

    if (error) {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['organizations', params.organizationId, 'views'], refetchType: 'all' });
    createToast({ message: t('views.delete.success'), type: 'success' });
  };

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-5xl">
      <Suspense>
        <Show when={query.data?.views}>
          {getViews => (
            <Show
              when={getViews().length > 0}
              fallback={(
                <EmptyState
                  title={t('views.no-views.title')}
                  icon="i-tabler-layout-list"
                  description={t('views.no-views.description')}
                  cta={(
                    <CreateViewModal organizationId={params.organizationId}>
                      {props => (
                        <Button {...props}>
                          <div class="i-tabler-plus size-4 mr-2" />
                          {t('views.no-views.create-view')}
                        </Button>
                      )}
                    </CreateViewModal>
                  )}
                />
              )}
            >
              <div class="flex justify-between sm:items-center pb-6 gap-4 flex-col sm:flex-row">
                <div>
                  <h2 class="text-xl font-bold">{t('views.title')}</h2>
                  <p class="text-muted-foreground mt-1">{t('views.description')}</p>
                </div>
                <div class="flex-shrink-0">
                  <CreateViewModal organizationId={params.organizationId}>
                    {props => (
                      <Button class="w-full" {...props}>
                        <div class="i-tabler-plus size-4 mr-2" />
                        {t('views.create')}
                      </Button>
                    )}
                  </CreateViewModal>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('views.table.headers.name')}</TableHead>
                    <TableHead>{t('views.table.headers.query')}</TableHead>
                    <TableHead class="text-right">{t('views.table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={getViews()}>
                    {view => (
                      <TableRow>
                        <TableCell class="font-medium">{view.name}</TableCell>
                        <TableCell>
                          <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{view.query}</code>
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-2 justify-end">
                            <UpdateViewModal organizationId={params.organizationId} view={view}>
                              {props => (
                                <Button size="icon" variant="outline" class="size-7" {...props}>
                                  <div class="i-tabler-edit size-4" />
                                </Button>
                              )}
                            </UpdateViewModal>
                            <Button size="icon" variant="outline" class="size-7 text-red" onClick={() => del({ view })}>
                              <div class="i-tabler-trash size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </Show>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
