import { safely } from '@corentinth/chisels';
import pLimit from 'p-limit';
import { addTagToDocument } from '../tags/tags.services';
import { invalidateOrganizationDocumentsQuery } from './documents.composables';
import { MAX_CONCURRENT_BULK_OPERATIONS } from './documents.constants';
import { deleteDocument } from './documents.services';

export async function bulkAddTagToDocuments({ documentIds, organizationId, tagId }: {
  documentIds: string[];
  organizationId: string;
  tagId: string;
}) {
  const limit = pLimit(MAX_CONCURRENT_BULK_OPERATIONS);
  let errorCount = 0;

  await Promise.all(
    documentIds.map(documentId =>
      limit(async () => {
        const [, error] = await safely(addTagToDocument({ documentId, organizationId, tagId }));
        if (error) {
          errorCount++;
        }
      }),
    ),
  );

  await invalidateOrganizationDocumentsQuery({ organizationId });

  return { successCount: documentIds.length - errorCount, errorCount };
}

export async function bulkDeleteDocuments({ documentIds, organizationId }: {
  documentIds: string[];
  organizationId: string;
}) {
  const limit = pLimit(MAX_CONCURRENT_BULK_OPERATIONS);
  let errorCount = 0;

  await Promise.all(
    documentIds.map(documentId =>
      limit(async () => {
        const [, error] = await safely(deleteDocument({ documentId, organizationId }));
        if (error) {
          errorCount++;
        }
      }),
    ),
  );

  await invalidateOrganizationDocumentsQuery({ organizationId });

  return { successCount: documentIds.length - errorCount, errorCount };
}
