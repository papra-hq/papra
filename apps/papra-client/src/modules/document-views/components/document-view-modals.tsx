import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX, ValidComponent } from 'solid-js';
import type { DocumentView } from '../document-views.types';
import { useNavigate } from '@solidjs/router';
import { useMutation } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { makeReturnVoidAsync } from '@/modules/shared/functions/void';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/ui/components/dialog';
import { createToast } from '@/modules/ui/components/sonner';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { createDocumentView, updateDocumentView } from '../document-views.services';

const DocumentViewForm: Component<{
  onSubmit: (values: { name: string; query: string; description?: string }) => unknown;
  initialValues?: { name?: string; query?: string; description?: string | null };
  submitButton: JSX.Element;
}> = (props) => {
  const { t } = useI18n();
  const { Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(props.onSubmit),
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('document-views.form.name.required')),
        v.maxLength(100, t('document-views.form.name.max-length')),
      ),
      query: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('document-views.form.query.required')),
        v.maxLength(500, t('document-views.form.query.max-length')),
      ),
      description: v.optional(
        v.pipe(
          v.string(),
          v.trim(),
          v.maxLength(256, t('document-views.form.description.max-length')),
        ),
      ),
    }),
    initialValues: {
      ...props.initialValues,
      description: props.initialValues?.description ?? undefined,
    },
  });

  return (
    <Form>
      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="name">{t('document-views.form.name.label')}</TextFieldLabel>
            <TextField
              type="text"
              id="name"
              {...inputProps}
              autoFocus
              value={field.value}
              aria-invalid={Boolean(field.error)}
              placeholder={t('document-views.form.name.placeholder')}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="query">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="query">{t('document-views.form.query.label')}</TextFieldLabel>
            <TextField
              type="text"
              id="query"
              {...inputProps}
              value={field.value}
              aria-invalid={Boolean(field.error)}
              placeholder={t('document-views.form.query.placeholder')}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            <div class="text-xs text-muted-foreground">{t('document-views.form.query.hint')}</div>
          </TextFieldRoot>
        )}
      </Field>

      <Field name="description">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="description">
              {t('document-views.form.description.label')}
              <span class="font-normal ml-1 text-muted-foreground">
                {t('document-views.form.description.optional')}
              </span>
            </TextFieldLabel>
            <TextArea
              id="description"
              {...inputProps}
              value={field.value}
              aria-invalid={Boolean(field.error)}
              placeholder={t('document-views.form.description.placeholder')}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex justify-end mt-6">{props.submitButton}</div>
    </Form>
  );
};

export const CreateDocumentViewModal: Component<{
  children?: <T extends ValidComponent | HTMLElement>(props: DialogTriggerProps<T>) => JSX.Element;
  organizationId: string;
  initialValues?: { name?: string; query?: string };
}> = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);
  const { t } = useI18n();
  const navigate = useNavigate();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const mutation = useMutation(() => ({
    mutationFn: (data: { name: string; query: string; description?: string }) =>
      createDocumentView({
        organizationId: props.organizationId,
        name: data.name,
        query: data.query,
        description: data.description,
      }),
    onSuccess: async ({ documentView }, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'document-views'],
        refetchType: 'all',
      });
      createToast({
        message: t('document-views.create.success', { name: variables.name }),
        type: 'success',
      });
      setIsOpen(false);
      navigate(`/organizations/${props.organizationId}/views/${documentView.id}`);
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
          <DialogTitle>{t('document-views.create')}</DialogTitle>
        </DialogHeader>
        <DocumentViewForm
          onSubmit={mutation.mutateAsync}
          initialValues={props.initialValues}
          submitButton={
            <Button type="submit" isLoading={mutation.isPending} disabled={!getIsOpen()}>
              {t('document-views.create')}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export const UpdateDocumentViewModal: Component<{
  children?: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
  documentView: DocumentView;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = (props) => {
  const [getInternalIsOpen, setInternalIsOpen] = createSignal(false);
  const getIsOpen = () => props.open ?? getInternalIsOpen();
  const setIsOpen = (open: boolean) => {
    props.onOpenChange?.(open);
    setInternalIsOpen(open);
  };
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const mutation = useMutation(() => ({
    mutationFn: (data: { name: string; query: string; description?: string }) =>
      updateDocumentView({
        organizationId: props.organizationId,
        documentViewId: props.documentView.id,
        name: data.name,
        query: data.query,
        description: data.description ?? null,
      }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'document-views'],
        refetchType: 'all',
      });
      createToast({
        message: t('document-views.update.success', { name: variables.name }),
        type: 'success',
      });
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
          <DialogTitle>{t('document-views.update')}</DialogTitle>
        </DialogHeader>
        <DocumentViewForm
          onSubmit={mutation.mutate}
          initialValues={props.documentView}
          submitButton={
            <Button type="submit" isLoading={mutation.isPending} disabled={!getIsOpen()}>
              {t('document-views.update')}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
};
