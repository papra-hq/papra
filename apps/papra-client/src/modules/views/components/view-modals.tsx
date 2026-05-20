import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX, ValidComponent } from 'solid-js';
import type { View } from '../views.types';
import { useMutation } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { makeReturnVoidAsync } from '@/modules/shared/functions/void';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { createView, updateView } from '../views.services';

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

export const CreateViewModal: Component<{
  children?: <T extends ValidComponent | HTMLElement>(props: DialogTriggerProps<T>) => JSX.Element;
  organizationId: string;
  initialValues?: { name?: string; query?: string };
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
          initialValues={props.initialValues}
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

export const UpdateViewModal: Component<{
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
