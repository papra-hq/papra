import type { Logger } from '../shared/logger/logger';
import type { StorageService } from '../storage/drivers/drivers.models';
import type { StoragePatternConfig } from './storage-patterns/storage-pattern.types';
import { buildOriginalDocumentKey } from './documents.models';
import { buildStorageKey } from './storage-patterns/storage-pattern.usecases';
import { ensureStorageKeyIsAvailable } from '../storage/storage.usecases';

export async function createDocumentStorageKey({
  storagePatternConfig,
  documentId,
  documentName,
  organizationId,
  documentsStorageService,
  logger,
  now = new Date(),
}: {
  storagePatternConfig: StoragePatternConfig;
  documentId: string;
  documentName: string;
  organizationId: string;
  documentsStorageService: Pick<StorageService, 'fileExists'>;
  logger?: Logger;
  now?: Date;
}) {
  const {
    useLegacyStorageKeyDefinitionSystem,
    storageKeyPattern,
    enableRandomSuffixFallback,
    maxIncrementalSuffixAttempts,
  } = storagePatternConfig;

  if (useLegacyStorageKeyDefinitionSystem) {
    const { originalDocumentStorageKey } = buildOriginalDocumentKey({
      documentId,
      fileName: documentName,
      organizationId,
    });

    return { storageKey: originalDocumentStorageKey };
  }

  const { storageKey: initialStorageKey } = buildStorageKey({
    storageKeyPattern,
    documentId,
    documentName,
    organizationId,
    now,
  });

  return ensureStorageKeyIsAvailable({
    initialStorageKey,
    maxIncrementalSuffixAttempts,
    enableRandomSuffixFallback,
    storageService: documentsStorageService,
    logger,
  });
}
