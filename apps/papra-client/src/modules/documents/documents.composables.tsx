import type { Document } from './documents.types';
import { createSignal } from 'solid-js';
import { useConfirmModal } from '../shared/confirm';
import { promptUploadFiles } from '../shared/files/upload';
import { queryClient } from '../shared/query/query-client';
import { createToast } from '../ui/components/sonner';
import { deleteDocument, restoreDocument, uploadDocument } from './documents.services';

export function useDeleteDocument() {
  const { confirm } = useConfirmModal();

  return {
    async deleteDocument({ documentId, organizationId, documentName }: { documentId: string; organizationId: string; documentName: string }) {
      const isConfirmed = await confirm({
        title: 'Delete document',
        message: (
          <>
            Are you sure you want to delete
            {' '}
            <span class="font-bold">{documentName}</span>
            ?
          </>
        ),
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

      await queryClient.invalidateQueries({
        queryKey: ['organizations', organizationId],
      });
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

      await queryClient.invalidateQueries({
        queryKey: ['organizations', document.organizationId],
      });

      createToast({ type: 'success', message: 'Document restored' });
      setIsRestoring(false);
    },
  };
}

export function useUploadDocuments({ organizationId }: { organizationId: string }) {
  const uploadDocuments = async ({ files }: { files: File[] }) => {
    for (const file of files) {
      await uploadDocument({ file, organizationId });
    }

    queryClient.invalidateQueries({
      // Invalidate the whole organization as the documents count and stats might have changed
      queryKey: ['organizations', organizationId],
      refetchType: 'all',
    });
  };

  return {
    uploadDocuments,
    promptImport: async () => {
      const { files } = await promptUploadFiles();

      await uploadDocuments({ files });
    },
  };
}
