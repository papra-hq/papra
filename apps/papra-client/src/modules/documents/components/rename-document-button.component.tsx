import type { Component, ParentComponent } from 'solid-js';
import { setValue } from '@modular-forms/solid';
import { useMutation } from '@tanstack/solid-query';
import { createContext, createEffect, createSignal, useContext } from 'solid-js';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/ui/components/dialog';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { getDocumentNameExtension, getDocumentNameWithoutExtension } from '../document.models';
import { invalidateOrganizationDocumentsQuery } from '../documents.composables';
import { updateDocument } from '../documents.services';

export const RenameDocumentDialog: Component<{
  documentId: string;
  organizationId: string;
  documentName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}> = (props) => {
  const { t } = useI18n();

  const renameDocumentMutation = useMutation(() => ({
    mutationFn: ({ name }: { name: string }) => updateDocument({ documentId: props.documentId, organizationId: props.organizationId, name }),
    onSuccess: async () => {
      createToast({
        message: t('documents.rename.success'),
        type: 'success',
      });

      props.setIsOpen(false);

      await invalidateOrganizationDocumentsQuery({ organizationId: props.organizationId });
    },

  }));

  const { Form, Field, form } = createForm({
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(255, t('documents.rename.form.name.max-length')),
        v.minLength(1, t('documents.rename.form.name.required')),
      ),
    }),
    initialValues: {
      name: getDocumentNameWithoutExtension({ name: props.documentName }),
    },
    onSubmit: async ({ name }) => {
      const extension = getDocumentNameExtension({ name: props.documentName });
      const newName = extension ? `${name}.${extension}` : name;

      await renameDocumentMutation.mutateAsync({ name: newName });
    },
  });

  createEffect(() => {
    setValue(form, 'name', getDocumentNameWithoutExtension({ name: props.documentName }));
  });

  return (
    <Dialog onOpenChange={props.setIsOpen} open={props.isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('documents.rename.title')}</DialogTitle>
        </DialogHeader>

        <Form>
          <Field name="name">
            {(field, inputProps) => (
              <TextFieldRoot>
                <TextFieldLabel class="sr-only" for="name">{t('documents.rename.form.name.label')}</TextFieldLabel>
                <TextField {...inputProps} value={field.value} id="name" placeholder={t('documents.rename.form.name.placeholder')} />
                {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
              </TextFieldRoot>
            )}
          </Field>

          <div class="flex justify-end mt-4 gap-2">
            <Button type="button" variant="secondary" onClick={() => props.setIsOpen(false)}>
              {t('documents.rename.cancel')}
            </Button>
            <Button type="submit">{t('documents.rename.form.submit')}</Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const context = createContext<{
  openRenameDialog: (args: { documentId: string; organizationId: string; documentName: string }) => void;
}>();

export function useRenameDocumentDialog() {
  const renameDialogContext = useContext(context);

  if (!renameDialogContext) {
    throw new Error('useRenameDocumentDialog must be used within a RenameDocumentDialogProvider');
  }

  return renameDialogContext;
}

export const RenameDocumentDialogProvider: ParentComponent = (props) => {
  const [getIsRenameDialogOpen, setIsRenameDialogOpen] = createSignal(false);
  const [getDocumentId, setDocumentId] = createSignal<string | undefined>(undefined);
  const [getOrganizationId, setOrganizationId] = createSignal<string | undefined>(undefined);
  const [getDocumentName, setDocumentName] = createSignal<string | undefined>(undefined);

  return (
    <context.Provider
      value={{
        openRenameDialog: ({ documentId, organizationId, documentName }) => {
          setIsRenameDialogOpen(true);
          setDocumentId(documentId);
          setOrganizationId(organizationId);
          setDocumentName(documentName);
        },
      }}
    >
      <RenameDocumentDialog
        documentId={getDocumentId() ?? ''}
        organizationId={getOrganizationId() ?? ''}
        documentName={getDocumentName() ?? ''}
        isOpen={getIsRenameDialogOpen()}
        setIsOpen={setIsRenameDialogOpen}
      />

      {props.children}
    </context.Provider>
  );
};
