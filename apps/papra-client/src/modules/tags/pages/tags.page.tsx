import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX } from 'solid-js';
import type { Tag as TagType } from '../tags.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { createForm } from '@/modules/shared/form/form';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/modules/ui/components/dialog';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { TextArea } from '@/modules/ui/components/textarea';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { getValues } from '@modular-forms/solid';
import { A, useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { createSignal, For, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { Tag } from '../components/tag.component';
import { createTag, deleteTag, fetchTags, updateTag } from '../tags.services';

const TagForm: Component<{
  onSubmit: (values: { name: string; color: string; description: string }) => Promise<void>;
  initialValues?: { name?: string; color?: string; description?: string | null };
  submitLabel?: string;
}> = (props) => {
  const { form, Form, Field } = createForm({
    onSubmit: props.onSubmit,
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty('Please enter a tag name'),
        v.maxLength(64, 'Tag name must be less than 64 characters'),
      ),
      color: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty('Please enter a color'),
        v.hexColor('The hex color is badly formatted.'),
      ),
      description: v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(256, 'Description must be less than 256 characters'),
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
            <TextFieldLabel for="name">Name</TextFieldLabel>
            <TextField type="text" id="name" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder="Eg. Contracts" />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="color">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="color">Color</TextFieldLabel>
            <TextField id="color" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder="Eg. #FF0000" />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="description">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="description">
              Description
              <span class="font-normal ml-1 text-muted-foreground">(optional)</span>
            </TextFieldLabel>
            <TextArea id="description" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} placeholder="Eg. All the contracts signed by the company" />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex flex-row-reverse justify-between items-center mt-6">
        <Button type="submit">
          {props.submitLabel ?? 'Create tag'}
        </Button>

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

  const onSubmit = async ({ name, color, description }: { name: string; color: string; description: string }) => {
    await createTag({
      name,
      color,
      description,
      organizationId: props.organizationId,
    });

    await queryClient.invalidateQueries({
      queryKey: ['organizations', props.organizationId],
      refetchType: 'all',
    });

    createToast({
      message: `Tag "${name}" created successfully.`,
      type: 'success',
    });

    setIsModalOpen(false);
  };

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new tag</DialogTitle>
        </DialogHeader>

        <TagForm onSubmit={onSubmit} initialValues={{ color: '#d8ff75' }} />
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

  const onSubmit = async ({ name, color, description }: { name: string; color: string; description: string }) => {
    await updateTag({
      name,
      color,
      description,
      organizationId: props.organizationId,
      tagId: props.tag.id,
    });

    await queryClient.invalidateQueries({
      queryKey: ['organizations', props.organizationId],
      refetchType: 'all',
    });

    createToast({
      message: `Tag "${name}" updated successfully.`,
      type: 'success',
    });

    setIsModalOpen(false);
  };

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      <DialogTrigger as={props.children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update tag</DialogTitle>
        </DialogHeader>

        <TagForm onSubmit={onSubmit} initialValues={props.tag} submitLabel="Update tag" />
      </DialogContent>
    </Dialog>
  );
};

export const TagsPage: Component = () => {
  const params = useParams();
  const { confirm } = useConfirmModal();
  const { t } = useI18n();

  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'tags'],
    queryFn: () => fetchTags({ organizationId: params.organizationId }),
  }));

  const del = async ({ tag }: { tag: TagType }) => {
    const confirmed = await confirm({
      title: 'Delete tag',
      message: 'Are you sure you want to delete this tag? Deleting a tag will remove it from all documents.',
      cancelButton: {
        text: 'Cancel',
        variant: 'secondary',
      },
      confirmButton: {
        text: 'Delete',
        variant: 'destructive',
      },
    });

    if (!confirmed) {
      return;
    }

    await deleteTag({
      organizationId: params.organizationId,
      tagId: tag.id,
    });

    await queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId],
      refetchType: 'all',
    });

    createToast({
      message: `Tag deleted successfully.`,
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
                    Documents Tags
                  </h2>

                  <p class="text-muted-foreground mt-1">
                    Tags are used to categorize documents. You can add tags to your documents to make them easier to find and organize.
                  </p>
                </div>

                <div class="flex-shrink-0">
                  <CreateTagModal organizationId={params.organizationId}>
                    {props => (
                      <Button class="w-full" {...props}>
                        <div class="i-tabler-plus size-4 mr-2" />
                        Create tag
                      </Button>
                    )}
                  </CreateTagModal>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead class="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={getTags()}>
                    {tag => (
                      <TableRow>
                        <TableCell>
                          <div>
                            <Tag name={tag.name} color={tag.color} />
                          </div>
                        </TableCell>
                        <TableCell>{tag.description || <span class="text-muted-foreground">No description</span>}</TableCell>
                        <TableCell>
                          <A href={`/organizations/${params.organizationId}/documents?tags=${tag.id}`} class="inline-flex items-center gap-1 hover:underline">
                            <div class="i-tabler-file-text size-5 text-muted-foreground" />
                            {tag.documentsCount}
                          </A>
                        </TableCell>
                        <TableCell class="text-muted-foreground" title={tag.createdAt.toLocaleString()}>
                          {timeAgo({ date: tag.createdAt })}
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
