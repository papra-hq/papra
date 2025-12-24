import type { ApiClient } from '../api/api.client';
import { queryClient } from '../api/providers/query.provider';
import { documentsLocalStorage } from './documents.local-storage';
import { uploadDocument } from './documents.services';

export async function syncUnsyncedDocuments({
  organizationId,
  apiClient,
  onProgress,
}: {
  organizationId: string;
  apiClient: ApiClient;
  onProgress?: (syncedCount: number, totalCount: number) => void;
}): Promise<void> {
  const unsyncedDocuments = await documentsLocalStorage.getUnsyncedDocumentsByOrganization(organizationId);

  if (unsyncedDocuments.length === 0) {
    return;
  }

  let syncedCount = 0;

  for (const unsyncedDoc of unsyncedDocuments) {
    try {
      await uploadDocument({ file: { uri: unsyncedDoc.localUri ?? '', name: unsyncedDoc.name, type: unsyncedDoc.mimeType }, apiClient, organizationId });

      // Delete the local file and remove from unsynced list
      await documentsLocalStorage.deleteUnsyncedDocumentFile(unsyncedDoc.id);
      await documentsLocalStorage.removeUnsyncedDocument(unsyncedDoc.id);

      syncedCount++;
      onProgress?.(syncedCount, unsyncedDocuments.length);

      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'documents'] });
    } catch (error) {
      console.error(`Error syncing document ${unsyncedDoc.id}:`, error);
      // Continue with next document even if one fails
    }
  }
}
