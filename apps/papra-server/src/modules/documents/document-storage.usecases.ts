import type { Clock } from '../shared/clock/clock.types';
import type { Logger } from '../shared/logger/logger';
import type { StorageService } from '../storage/drivers/drivers.models';
import type { DocumentsRepository } from './documents.repository';
import type { StoragePatternConfig } from './storage-patterns/storage-pattern.types';
import { systemClock } from '../shared/clock/clock';
import { createLogger } from '../shared/logger/logger';
import { ensureStorageKeyIsAvailable } from '../storage/storage.usecases';
import { buildOriginalDocumentKey } from './documents.models';
import { buildStorageKey } from './storage-patterns/storage-pattern.usecases';
import { safely } from '@corentinth/chisels';

export type SyncDocumentStorageKey = (args: {
  documentId: string;
  organizationId: string;
}) => Promise<void>;

export function buildSyncDocumentStorageKey({
  storagePatternConfig,
  documentsRepository,
  documentsStorageService,
  logger = createLogger({ namespace: 'sync-document-storage-key' }),
  clock = systemClock,
}: {
  storagePatternConfig: StoragePatternConfig;
  documentsRepository: Pick<DocumentsRepository, 'getDocumentById' | 'updateDocumentStorageKey'>;
  documentsStorageService: Pick<StorageService, 'fileExists' | 'copyFile' | 'deleteFile'>;
  logger?: Logger;
  clock?: Clock;
}): SyncDocumentStorageKey {
  async function cleanup(storageKey: string) {
    try {
      await documentsStorageService.deleteFile({ storageKey });
    } catch (error) {
      logger.error({ error, storageKey }, 'Failed to clean up document storage key');
    }
  }

  return async ({ documentId, organizationId }) => {
    if (
      !storagePatternConfig.isStorageKeySyncEnabled ||
      storagePatternConfig.useLegacyStorageKeyDefinitionSystem
    ) {
      return;
    }

    const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });
    if (!document || document.isDeleted) {
      return;
    }

    const sourceStorageKey = document.originalStorageKey;
    const { storageKey: initialStorageKey } = buildStorageKey({
      storageKeyPattern: storagePatternConfig.storageKeyPattern,
      documentId,
      organizationId,
      documentName: document.name,
      documentDate: document.documentDate,
      documentCreatedAt: document.createdAt,
      now: new Date(clock.now().epochMilliseconds),
    });

    if (sourceStorageKey === initialStorageKey) {
      return;
    }

    const { storageKey } = await ensureStorageKeyIsAvailable({
      initialStorageKey,
      maxIncrementalSuffixAttempts: storagePatternConfig.maxIncrementalSuffixAttempts,
      enableRandomSuffixFallback: storagePatternConfig.enableRandomSuffixFallback,
      storageService: documentsStorageService,
      logger,
    });

    await documentsStorageService.copyFile({ sourceStorageKey, destinationStorageKey: storageKey });

    const [updateResult, error] = await safely(
      documentsRepository.updateDocumentStorageKey({
        documentId,
        organizationId,
        sourceStorageKey,
        storageKey,
        name: document.name,
        updatedAt: document.updatedAt,
      }),
    );

    if (error) {
      logger.error(
        { error, documentId, organizationId, sourceStorageKey, storageKey },
        'Failed to update document storage key',
      );
      // No cleanup, the error can be caused by a race condition where a sync task already updated the document storage key.
      throw error;
    }

    logger.info(
      { documentId, organizationId, sourceStorageKey, storageKey, updated: updateResult.updated },
      'Document storage key updated',
    );

    if (updateResult.updated) {
      await cleanup(sourceStorageKey);
    }
  };
}

export async function createDocumentStorageKey({
  storagePatternConfig,
  documentId,
  documentName,
  documentDate,
  documentCreatedAt,
  organizationId,
  documentsStorageService,
  logger,
  now = new Date(),
}: {
  storagePatternConfig: StoragePatternConfig;
  documentId: string;
  documentName: string;
  documentDate: Date | null;
  documentCreatedAt: Date;
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
    documentDate,
    documentCreatedAt,
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
