import type { Document } from './documents.types';
import { createSignal } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { downloadFile } from '@/modules/shared/files/download';
import { isHttpErrorWithCode, isRateLimitError } from '@/modules/shared/http/http-errors';
import { useConfirmModal } from '../shared/confirm';
import { queryClient } from '../shared/query/query-client';
import { createToast } from '../ui/components/sonner';
import {
  deleteDocument,
  fetchDocument,
  fetchDocumentFile,
  reprocessDocument,
  restoreDocument,
} from './documents.services';

export async function invalidateOrganizationDocumentsQuery({
  organizationId,
}: {
  organizationId: string;
}) {
  return queryClient.invalidateQueries({
    queryKey: ['organizations', organizationId],
  });
}

function getConfirmMessage(documentName: string) {
  return (
    <>
      Are you sure you want to delete <span class="font-bold">{documentName}</span>?
    </>
  );
}

export function useDownloadDocument() {
  const { t } = useI18n();

  return {
    downloadDocument: async ({
      organizationId,
      documentId,
    }: {
      organizationId: string;
      documentId: string;
    }) => {
      try {
        const [document, documentFile] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: ['organizations', organizationId, 'documents', documentId],
            queryFn: async () => fetchDocument({ documentId, organizationId }),
          }),
          queryClient.fetchQuery({
            queryKey: ['organizations', organizationId, 'documents', documentId, 'file'],
            queryFn: async () => fetchDocumentFile({ documentId, organizationId }),
          }),
        ]);

        const url = URL.createObjectURL(documentFile);

        downloadFile({ url, fileName: document.document.name });

        URL.revokeObjectURL(url);
      } catch {
        createToast({ type: 'error', message: t('documents.actions.download.error') });
      }
    },
  };
}

export function useDeleteDocument() {
  const { confirm } = useConfirmModal();

  return {
    deleteDocument: async ({
      documentId,
      organizationId,
      documentName,
    }: {
      documentId: string;
      organizationId: string;
      documentName: string;
    }): Promise<{ hasDeleted: boolean }> => {
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

export function useReprocessDocument() {
  const { confirm } = useConfirmModal();
  const { t } = useI18n();
  const [getIsReprocessing, setIsReprocessing] = createSignal(false);

  return {
    getIsReprocessing,
    reprocess: async ({ document }: { document: Document }) => {
      if (getIsReprocessing() || document.isDeleted) {
        return;
      }

      setIsReprocessing(true);

      try {
        const isConfirmed = await confirm({
          title: t('documents.reprocess.confirm.title'),
          message: t('documents.reprocess.confirm.description'),
          confirmButton: { text: t('documents.reprocess.confirm.submit') },
          cancelButton: { text: t('documents.actions.cancel') },
        });

        if (!isConfirmed) {
          return;
        }

        await reprocessDocument({
          documentId: document.id,
          organizationId: document.organizationId,
        });

        createToast({
          type: 'success',
          message: t('documents.reprocess.queued'),
          description: t('documents.reprocess.queued.description'),
        });
      } catch (error) {
        let message = t('documents.reprocess.error');

        if (isRateLimitError({ error })) {
          message = t('documents.reprocess.rate-limited');
        } else if (isHttpErrorWithCode({ error, code: 'document.reprocessing_disabled' })) {
          message = t('documents.reprocess.disabled');
        }

        createToast({ type: 'error', message });
      } finally {
        setIsReprocessing(false);
      }
    },
  };
}

export function useRestoreDocument() {
  const [getIsRestoring, setIsRestoring] = createSignal(false);

  return {
    getIsRestoring,
    restore: async ({ document }: { document: Document }) => {
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
