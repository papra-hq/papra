import type { Component, ParentComponent } from 'solid-js';
import { useQuery } from '@tanstack/solid-query';
import { createContext, createEffect, createSignal, on, Show, useContext } from 'solid-js';
import { Dialog, DialogContent } from '@/modules/ui/components/dialog';
import { fetchDocumentShareLinks } from '../document-share-links.services';
import { ShareDocumentDialogCreateView } from './share-document-dialog-create-view.component';
import { ShareDocumentDialogCreatedView } from './share-document-dialog-created-view.component';
import { ShareDocumentDialogListView } from './share-document-dialog-list-view.component';

type DialogView = 'loading' | 'list' | 'create' | 'created';

export const ShareDocumentDialog: Component<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: { id: string; organizationId: string; name: string };
}> = (props) => {
  const [getView, setView] = createSignal<DialogView>('loading');

  // Created-state link to display.
  const [getCreatedUrl, setCreatedUrl] = createSignal('');

  const shareLinksQuery = useQuery(() => ({
    queryKey: ['organizations', props.document.organizationId, 'share-links', 'document', props.document.id],
    queryFn: () => fetchDocumentShareLinks({ organizationId: props.document.organizationId, documentId: props.document.id }),
    enabled: props.open,
  }));

  const hasExistingLinks = () => (shareLinksQuery.data?.shareLinks.length ?? 0) > 0;

  // Reset everything each time the dialog opens.
  createEffect(on(() => props.open, (open) => {
    if (open) {
      setCreatedUrl('');
      setView('loading');
    }
  }));

  // Once the links have loaded, decide the initial view: the list when links exist, otherwise the create form.
  createEffect(() => {
    if (props.open && getView() === 'loading' && shareLinksQuery.isSuccess) {
      setView(hasExistingLinks() ? 'list' : 'create');
    }
  });

  const goToCreate = () => {
    setView('create');
  };

  const handleCancelCreate = () => {
    // Came from the list (existing links) → go back to it; otherwise close the dialog.
    if (hasExistingLinks()) {
      setView('list');
      return;
    }

    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[540px]">
        <Show when={getView() === 'loading'}>
          <div class="flex items-center justify-center py-10">
            <div class="i-tabler-loader-2 size-6 animate-spin text-muted-foreground" />
          </div>
        </Show>

        <Show when={getView() === 'list'}>
          <ShareDocumentDialogListView
            shareLinks={shareLinksQuery.data?.shareLinks ?? []}
            documentName={props.document.name}
            onCreateNew={goToCreate}
          />
        </Show>

        <Show when={getView() === 'create'}>
          <ShareDocumentDialogCreateView
            document={props.document}
            onCancel={handleCancelCreate}
            onCreated={({ url }) => {
              setCreatedUrl(url);
              setView('created');
            }}
          />
        </Show>

        <Show when={getView() === 'created'}>
          <ShareDocumentDialogCreatedView
            url={getCreatedUrl()}
            onDone={() => props.onOpenChange(false)}
          />
        </Show>
      </DialogContent>
    </Dialog>
  );
};

const context = createContext<{
  openShareDialog: (args: { documentId: string; organizationId: string; documentName: string }) => void;
}>();

export function useShareDocumentDialog() {
  const shareDialogContext = useContext(context);

  if (!shareDialogContext) {
    throw new Error('useShareDocumentDialog must be used within a ShareDocumentDialogProvider');
  }

  return shareDialogContext;
}

export const ShareDocumentDialogProvider: ParentComponent = (props) => {
  const [getIsOpen, setIsOpen] = createSignal(false);
  const [getDocumentId, setDocumentId] = createSignal<string | undefined>(undefined);
  const [getOrganizationId, setOrganizationId] = createSignal<string | undefined>(undefined);
  const [getDocumentName, setDocumentName] = createSignal<string | undefined>(undefined);

  return (
    <context.Provider
      value={{
        openShareDialog: ({ documentId, organizationId, documentName }) => {
          setDocumentId(documentId);
          setOrganizationId(organizationId);
          setDocumentName(documentName);
          setIsOpen(true);
        },
      }}
    >
      <Show when={getDocumentId() && getOrganizationId()}>
        <ShareDocumentDialog
          open={getIsOpen()}
          onOpenChange={setIsOpen}
          document={{ id: getDocumentId() ?? '', organizationId: getOrganizationId() ?? '', name: getDocumentName() ?? '' }}
        />
      </Show>

      {props.children}
    </context.Provider>
  );
};
