import type { Document } from './documents.types';
import { createSignal } from 'solid-js';
import { downloadFile } from '@/modules/shared/files/download';
import { useConfirmModal } from '../shared/confirm';
import { queryClient } from '../shared/query/query-client';
import { createToast } from '../ui/components/sonner';
import { deleteDocument, fetchDocument, fetchDocumentFile, restoreDocument } from './documents.services';

export function invalidateOrganizationDocumentsQuery({ organizationId }: { organizationId: string }) {
  return queryClient.invalidateQueries({
    queryKey: ['organizations', organizationId],
  });
}

function getConfirmMessage(documentName: string) {
  return (
    <>
      Are you sure you want to delete
      {' '}
      <span class="font-bold">{documentName}</span>
      ?
    </>
  );
}

export function useDownloadDocument() {
  return {
    async downloadDocument({ organizationId, documentId}: { organizationId: string; documentId: string }) {
      const document = await fetchDocument({ documentId, organizationId });
      const documentFile = await fetchDocumentFile({ documentId, organizationId });

      const getDataUrl = () => documentFile ? URL.createObjectURL(documentFile) : undefined;

      downloadFile({ url: getDataUrl()!, fileName: document.document.name });
    },
  };
}

export function useDeleteDocument() {
  const { confirm } = useConfirmModal();

  return {
    async deleteDocument({ documentId, organizationId, documentName }: { documentId: string; organizationId: string; documentName: string }): Promise<{ hasDeleted: boolean }> {
      const isConfirmed = await confirm({
        title: 'Delete document',
        message: getConfirmMessage(documentName),
        confirmButton: {
          text: 'Delete document',
          variant: 'destructive',
        },
        cancelButton: {
          text: 'Cancel',
        },
      });

      if (!isConfirmed) {
        return { hasDeleted: false };
      }

      await deleteDocument({
        documentId,
        organizationId,
      });

      await invalidateOrganizationDocumentsQuery({ organizationId });
      createToast({ type: 'success', message: 'Document deleted' });

      return { hasDeleted: true };
    },
  };
}

export function useRestoreDocument() {
  const [getIsRestoring, setIsRestoring] = createSignal(false);

  return {
    getIsRestoring,
    async restore({ document }: { document: Document }) {
      setIsRestoring(true);

      await restoreDocument({
        documentId: document.id,
        organizationId: document.organizationId,
      });

      await invalidateOrganizationDocumentsQuery({ organizationId: document.organizationId });

      createToast({ type: 'success', message: 'Document restored' });
      setIsRestoring(false);
    },
  };
}
