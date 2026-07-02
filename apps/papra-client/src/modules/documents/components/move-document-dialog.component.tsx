import type { Component, ParentComponent } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createContext, createSignal, useContext, Show, For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/ui/components/dialog';
import { createToast } from '@/modules/ui/components/sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { fetchOrganizations } from '@/modules/organizations/organizations.services';
import { invalidateOrganizationDocumentsQuery } from '../documents.composables';
import { moveDocument } from '../documents.services';

export const MoveDocumentDialog: Component<{
  documentId: string;
  organizationId: string;
  documentName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}> = (props) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [getTargetOrgId, setTargetOrgId] = createSignal<string | undefined>(undefined);

  const orgsQuery = useQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  const invitableOrgs = () => {
    return orgsQuery.data?.organizations.filter((org) => org.id !== props.organizationId) ?? [];
  };

  const moveDocumentMutation = useMutation(() => ({
    mutationFn: async ({ targetOrganizationId }: { targetOrganizationId: string }) =>
      moveDocument({
        documentId: props.documentId,
        organizationId: props.organizationId,
        targetOrganizationId,
      }),
    onSuccess: async (_, { targetOrganizationId }) => {
      createToast({
        message: t('documents.move.success'),
        type: 'success',
      });

      props.setIsOpen(false);

      await invalidateOrganizationDocumentsQuery({ organizationId: props.organizationId });
      await invalidateOrganizationDocumentsQuery({ organizationId: targetOrganizationId });

      // If user is currently on the document detail page, redirect to the new path
      const detailPath = `/organizations/${props.organizationId}/documents/${props.documentId}`;
      if (location.pathname.startsWith(detailPath)) {
        navigate(`/organizations/${targetOrganizationId}/documents/${props.documentId}`);
      }
    },
    onError: (error: any) => {
      createToast({
        message: error?.message || t('documents.move.error'),
        type: 'error',
      });
    }
  }));

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const target = getTargetOrgId();
    if (!target) return;
    await moveDocumentMutation.mutateAsync({ targetOrganizationId: target });
  };

  return (
    <Dialog onOpenChange={props.setIsOpen} open={props.isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('documents.move.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} class="space-y-4">
          <p class="text-sm text-muted-foreground">
            {t('documents.move.warning')}
          </p>

          <div>
            <label class="text-sm font-medium mb-1 block">
              {t('documents.move.select-label')}
            </label>
            <Select
              options={invitableOrgs()}
              optionValue="id"
              optionTextValue="name"
              itemComponent={(itemProps) => (
                <SelectItem class="cursor-pointer" item={itemProps.item}>
                  {itemProps.item.rawValue.name}
                </SelectItem>
              )}
              value={invitableOrgs().find((org) => org.id === getTargetOrgId())}
              onChange={(value) => setTargetOrgId((value as any)?.id)}
            >
              <SelectTrigger>
                <SelectValue<any>>
                  {(state) => state.selectedOption()?.name || t('documents.move.select-placeholder')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => props.setIsOpen(false)}>
              {t('documents.move.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!getTargetOrgId() || moveDocumentMutation.isPending}
              isLoading={moveDocumentMutation.isPending}
            >
              {t('documents.move.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const context = createContext<{
  openMoveDialog: (args: {
    documentId: string;
    organizationId: string;
    documentName: string;
  }) => void;
}>();

export function useMoveDocumentDialog() {
  const moveDialogContext = useContext(context);
  if (!moveDialogContext) {
    throw new Error('useMoveDocumentDialog must be used within a MoveDocumentDialogProvider');
  }
  return moveDialogContext;
}

export const MoveDocumentDialogProvider: ParentComponent = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);
  const [getDocumentId, setDocumentId] = createSignal<string | undefined>(undefined);
  const [getOrganizationId, setOrganizationId] = createSignal<string | undefined>(undefined);
  const [getDocumentName, setDocumentName] = createSignal<string | undefined>(undefined);

  return (
    <context.Provider
      value={{
        openMoveDialog: ({ documentId, organizationId, documentName }) => {
          setIsOpen(true);
          setDocumentId(documentId);
          setOrganizationId(organizationId);
          setDocumentName(documentName);
        },
      }}
    >
      <MoveDocumentDialog
        documentId={getDocumentId() ?? ''}
        organizationId={getOrganizationId() ?? ''}
        documentName={getDocumentName() ?? ''}
        isOpen={getIsOpen()}
        setIsOpen={setIsOpen}
      />
      {props.children}
    </context.Provider>
  );
};
