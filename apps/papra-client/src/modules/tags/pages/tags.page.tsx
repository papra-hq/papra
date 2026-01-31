import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX } from 'solid-js';
import type { Tag as TagType } from '../tags.types';
import { safely } from '@corentinth/chisels';
import { getValues, setValue } from '@modular-forms/solid';
import { A, useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSignal, For, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { makeDocumentSearchPermalink } from '@/modules/documents/document.models';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { makeReturnVoidAsync } from '@/modules/shared/functions/void';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { ColorSwatchPicker } from '@/modules/ui/components/color-swatch-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { Tag, TagLink } from '../components/tag.component';
import { createTag, deleteTag, fetchTags, updateTag } from '../tags.services';

// To keep, useful for generating swatches
// function generateSwatches(count = 9, saturation = 100, lightness = 74) {
//   const colors = [];
//   for (let i = 0; i < count; i++) {
//     const hue = Math.round((78 + i * 360 / count) % 360);
//     const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
//     colors.push(parseColor(hsl).toString('hex').toUpperCase());
//   }
//   return colors;
// }

const defaultColors = ['#D8FF75', '#7FFF7A', '#7AFFCE', '#7AD7FF', '#7A7FFF', '#CE7AFF', '#FF7AD7', '#FF7A7F', '#FFCE7A', '#FFFFFF'];

const TagColorPicker: Component<{
  color: string;
  onChange: (color: string) => void;
}> = (props) => {
  return <ColorSwatchPicker value={props.color} onChange={props.onChange} colors={defaultColors} />;
};

const TagForm: Component<{
  onSubmit: (values: { name: string; color: string; description: string }) => Promise<unknown> | unknown;
  initialValues?: { name?: string; color?: string; description?: string | null };
  submitButton: JSX.Element;
}> = (props) => {
  const { t } = useI18n();
  const { form, Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(props.onSubmit),
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('tags.form.name.required')),
        v.maxLength(64, t('tags.form.name.max-length')),
      ),
      color: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('tags.form.color.required')),
        v.hexColor(t('tags.form.color.invalid')),
      ),
      description: v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(256, t('tags.form.description.max-length')),
      ),
    }),
    initialValues: {
      ...props.initialValues,
      description: props.initialValues?.description ?? undefined,
    },
  });

  const getFormValues = () => getValues(form);

  return (
    <Form>
      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="name">{t('tags.form.name.label')}</TextFieldLabel>
            <TextField type="text" id="name" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('tags.form.name.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="color">
        {field => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="color">{t('tags.form.color.label')}</TextFieldLabel>
            <TagColorPicker color={field.value ?? ''} onChange={color => setValue(form, 'color', color)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="description">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="description">
              {t('tags.form.description.label')}
              <span class="font-normal ml-1 text-muted-foreground">{t('tags.form.description.optional')}</span>
            </TextFieldLabel>
            <TextArea id="description" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder={t('tags.form.description.placeholder')} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex flex-row-reverse justify-between items-center mt-6">
        {props.submitButton}

        {getFormValues().name && (
          <Tag {...getFormValues()} />
        )}
      </div>
    </Form>
  );
};

export const CreateTagModal: Component<{
  children: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const createTagMutation = useMutation(() => ({
    mutationFn: (data: { name: string; color: string; description: string }) => createTag({
      name: data.name,
      color: data.color.toLowerCase(),
      description: data.description,
      organizationId: props.organizationId,
    }),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId],
        refetchType: 'all',
      });

      createToast({
        message: t('tags.create.success', { name: variables.name }),
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
          <DialogTitle>{t('tags.create')}</DialogTitle>
        </DialogHeader>

        <TagForm
          onSubmit={createTagMutation.mutateAsync}
          initialValues={{ color: '#D8FF75' }}
          submitButton={(
            <Button
              type="submit"
              isLoading={createTagMutation.isPending}
              disabled={!getIsModalOpen()} // As the dialog closing animation may still be running
            >
              { t('tags.create') }
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

const UpdateTagModal: Component<{
  children: (props: DialogTriggerProps) => JSX.Element;
  organizationId: string;
  tag: TagType;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const updateTagMutation = useMutation(() => ({
    mutationFn: (data: { name: string; color: string; description: string }) => updateTag({
      name: data.name,
      color: data.color.toLowerCase(),
      description: data.description,
      organizationId: props.organizationId,
      tagId: props.tag.id,
    }),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId],
        refetchType: 'all',
      });

      createToast({
        message: t('tags.update.success', { name: variables.name }),
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
          <DialogTitle>{t('tags.update')}</DialogTitle>
        </DialogHeader>

        <TagForm
          onSubmit={updateTagMutation.mutate}
          initialValues={props.tag}
          submitButton={(
            <Button
              type="submit"
              isLoading={updateTagMutation.isPending}
              disabled={!getIsModalOpen()} // As the dialog closing animation may still be running
            >
              { t('tags.update') }
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  );
};

export const TagsPage: Component = () => {
  const params = useParams();
  const { confirm } = useConfirmModal();
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'tags'],
    queryFn: () => fetchTags({ organizationId: params.organizationId }),
  }));

  const del = async ({ tag }: { tag: TagType }) => {
    const confirmed = await confirm({
      title: t('tags.delete.confirm.title'),
      message: t('tags.delete.confirm.message'),
      cancelButton: {
        text: t('tags.delete.confirm.cancel-button'),
        variant: 'secondary',
      },
      confirmButton: {
        text: t('tags.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(deleteTag({
      organizationId: params.organizationId,
      tagId: tag.id,
    }));

    if (error) {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });

      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId],
      refetchType: 'all',
    });

    createToast({
      message: t('tags.delete.success'),
      type: 'success',
    });
  };

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-5xl">
      <Suspense>
        <Show when={query.data?.tags}>
          {getTags => (
            <Show
              when={getTags().length > 0}
              fallback={(
                <EmptyState
                  title={t('tags.no-tags.title')}
                  icon="i-tabler-tag"
                  description={t('tags.no-tags.description')}
                  cta={(
                    <CreateTagModal organizationId={params.organizationId}>
                      {props => (
                        <Button {...props}>
                          <div class="i-tabler-plus size-4 mr-2" />
                          {t('tags.no-tags.create-tag')}
                        </Button>
                      )}
                    </CreateTagModal>
                  )}
                />
              )}
            >
              <div class="flex justify-between sm:items-center pb-6 gap-4 flex-col sm:flex-row">
                <div>
                  <h2 class="text-xl font-bold ">
                    {t('tags.title')}
                  </h2>

                  <p class="text-muted-foreground mt-1">
                    {t('tags.description')}
                  </p>
                </div>

                <div class="flex-shrink-0">
                  <CreateTagModal organizationId={params.organizationId}>
                    {props => (
                      <Button class="w-full" {...props}>
                        <div class="i-tabler-plus size-4 mr-2" />
                        {t('tags.create')}
                      </Button>
                    )}
                  </CreateTagModal>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tags.table.headers.tag')}</TableHead>
                    <TableHead>{t('tags.table.headers.description')}</TableHead>
                    <TableHead>{t('tags.table.headers.documents')}</TableHead>
                    <TableHead>{t('tags.table.headers.created')}</TableHead>
                    <TableHead class="text-right">
                      {t('tags.table.headers.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={getTags()}>
                    {tag => (
                      <TableRow>
                        <TableCell>
                          <div>
                            <TagLink {...tag} />
                          </div>
                        </TableCell>
                        <TableCell class="text-wrap">{tag.description || <span class="text-muted-foreground">{t('tags.form.no-description')}</span>}</TableCell>
                        <TableCell>
                          <A href={makeDocumentSearchPermalink({ organizationId: params.organizationId, search: { tags: [tag] } })} class="inline-flex items-center gap-1 hover:underline">
                            <div class="i-tabler-file-text size-5 text-muted-foreground" />
                            {tag.documentsCount}
                          </A>
                        </TableCell>
                        <TableCell class="text-muted-foreground" title={tag.createdAt.toLocaleString()}>
                          <RelativeTime date={tag.createdAt} />
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-2 justify-end">

                            <UpdateTagModal organizationId={params.organizationId} tag={tag}>
                              {props => (
                                <Button size="icon" variant="outline" class="size-7" {...props}>
                                  <div class="i-tabler-edit size-4" />
                                </Button>
                              )}
                            </UpdateTagModal>

                            <Button size="icon" variant="outline" class="size-7 text-red" onClick={() => del({ tag })}>
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
