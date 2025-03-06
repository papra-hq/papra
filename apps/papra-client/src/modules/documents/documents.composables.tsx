import type { Document } from './documents.types';
import { safely } from '@corentinth/chisels';
import { throttle } from 'lodash-es';
import { createSignal } from 'solid-js';
import { useConfirmModal } from '../shared/confirm';
import { promptUploadFiles } from '../shared/files/upload';
import { isHttpErrorWithCode } from '../shared/http/http-errors';
import { queryClient } from '../shared/query/query-client';
import { createToast } from '../ui/components/sonner';
import { deleteDocument, restoreDocument, uploadDocument } from './documents.services';

function invalidateOrganizationDocumentsQuery({ organizationId }: { organizationId: string }) {
  return queryClient.invalidateQueries({
    queryKey: ['organizations', organizationId],
  });
}

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

export function useUploadDocuments({ organizationId }: { organizationId: string }) {
  const uploadDocuments = async ({ files }: { files: File[] }) => {
    const throttledInvalidateOrganizationDocumentsQuery = throttle(invalidateOrganizationDocumentsQuery, 500);

    await Promise.all(files.map(async (file) => {
      const [, error] = await safely(uploadDocument({ file, organizationId }));

      if (isHttpErrorWithCode({ error, code: 'document.already_exists' })) {
        createToast({
          type: 'error',
          message: 'Document already exists',
          description: `The document ${file.name} already exists, it has not been uploaded.`,
        });
      }

      await throttledInvalidateOrganizationDocumentsQuery({ organizationId });
    }),
    );
  };

  return {
    uploadDocuments,
    promptImport: async () => {
      const { files } = await promptUploadFiles();

      await uploadDocuments({ files });
    },
  };
}
