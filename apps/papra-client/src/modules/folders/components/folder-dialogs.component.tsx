import type { DialogTriggerProps } from '@kobalte/core/dialog';
import type { Component, JSX, ValidComponent } from 'solid-js';
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
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { createFolder, updateFolder } from '../folders.services';
import type { Folder } from '../folders.types';

export const CreateFolderDialog: Component<{
  children?: <T extends ValidComponent | HTMLElement>(props: DialogTriggerProps<T>) => JSX.Element;
  organizationId: string;
  parentId?: string | null;
  onCreated?: (args: { folder: Folder }) => void | Promise<void>;
}> = (props) => {
  const [getIsModalOpen, setIsModalOpen] = createSignal(false);
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const createFolderMutation = useMutation(() => ({
    mutationFn: async (data: { name: string }) =>
      createFolder({
        name: data.name,
        parentId: props.parentId ?? null,
        organizationId: props.organizationId,
      }),
    onSuccess: async ({ folder }, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'folders'],
        refetchType: 'all',
      });

      createToast({
        message: t('folders.create.success', { name: variables.name }),
        type: 'success',
      });
      setIsModalOpen(false);
      void props.onCreated?.({ folder });
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const { Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(createFolderMutation.mutateAsync),
    schema: v.object({
      name: v.pipe(v.string(), v.trim(), v.nonEmpty(t('folders.form.name.required'))),
    }),
  });

  return (
    <Dialog open={getIsModalOpen()} onOpenChange={setIsModalOpen}>
      {props.children && <DialogTrigger as={props.children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('folders.create.title')}</DialogTitle>
        </DialogHeader>

        <Form>
          <Field name="name">
            {(field, inputProps) => (
              <TextFieldRoot class="flex flex-col gap-1 mb-4">
                <TextFieldLabel for="name">{t('folders.form.name.label')}</TextFieldLabel>
                <TextField
                  type="text"
                  id="name"
                  {...inputProps}
                  autoFocus
                  value={field.value}
                  aria-invalid={Boolean(field.error)}
                  placeholder={t('folders.form.name.placeholder')}
                />
                {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
              </TextFieldRoot>
            )}
          </Field>

          <div class="flex justify-end mt-6">
            <Button type="submit" isLoading={createFolderMutation.isPending}>
              {t('folders.create.title')}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const RenameFolderDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  folder: Folder;
}> = (props) => {
  const { t } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });

  const updateFolderMutation = useMutation(() => ({
    mutationFn: async (data: { name: string }) =>
      updateFolder({
        organizationId: props.organizationId,
        folderId: props.folder.id,
        name: data.name,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', props.organizationId, 'folders'],
        refetchType: 'all',
      });

      createToast({ message: t('folders.rename.success'), type: 'success' });
      props.onOpenChange(false);
    },
    onError: (error) => {
      createToast({ message: getErrorMessage({ error }), type: 'error' });
    },
  }));

  const { Form, Field } = createForm({
    onSubmit: makeReturnVoidAsync(updateFolderMutation.mutateAsync),
    schema: v.object({
      name: v.pipe(v.string(), v.trim(), v.nonEmpty(t('folders.form.name.required'))),
    }),
    initialValues: { name: props.folder.name },
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('folders.rename.title')}</DialogTitle>
        </DialogHeader>

        <Form>
          <Field name="name">
            {(field, inputProps) => (
              <TextFieldRoot class="flex flex-col gap-1 mb-4">
                <TextFieldLabel for="name">{t('folders.form.name.label')}</TextFieldLabel>
                <TextField
                  type="text"
                  id="name"
                  {...inputProps}
                  autoFocus
                  value={field.value}
                  aria-invalid={Boolean(field.error)}
                />
                {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
              </TextFieldRoot>
            )}
          </Field>

          <div class="flex justify-end mt-6">
            <Button type="submit" isLoading={updateFolderMutation.isPending}>
              {t('folders.rename.title')}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
