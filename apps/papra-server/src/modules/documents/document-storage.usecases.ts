import type { Clock } from '../shared/clock/clock.types';
import type { Logger } from '../shared/logger/logger';
import type { StorageService } from '../storage/drivers/drivers.models';
import type { DocumentsRepository } from './documents.repository';
import type {
  ResolveStoragePatternContext,
  StoragePatternConfig,
  StoragePatternInterpolationContext,
} from './storage-patterns/storage-pattern.types';
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
  resolveStoragePatternContext,
  logger = createLogger({ namespace: 'sync-document-storage-key' }),
  clock = systemClock,
}: {
  storagePatternConfig: StoragePatternConfig;
  documentsRepository: Pick<DocumentsRepository, 'getDocumentById' | 'updateDocumentStorageKey'>;
  documentsStorageService: Pick<StorageService, 'fileExists' | 'copyFile' | 'deleteFile'>;
  resolveStoragePatternContext: ResolveStoragePatternContext;
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
    const context = await resolveStoragePatternContext({
      storageKeyPattern: storagePatternConfig.storageKeyPattern,
      documentId,
      organizationId,
      documentName: document.name,
      documentDate: document.documentDate,
      documentCreatedAt: document.createdAt,
      now: new Date(clock.now().epochMilliseconds),
    });
    const { storageKey: initialStorageKey } = buildStorageKey({
      storageKeyPattern: storagePatternConfig.storageKeyPattern,
      ...context,
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

export type CreateDocumentStorageKey = (
  args: Omit<StoragePatternInterpolationContext, 'organizationName' | 'now'> & { now?: Date },
) => Promise<{ storageKey: string }>;

export function buildCreateDocumentStorageKey({
  storagePatternConfig,
  resolveStoragePatternContext,
  documentsStorageService,
  logger,
}: {
  storagePatternConfig: StoragePatternConfig;
  resolveStoragePatternContext: ResolveStoragePatternContext;
  documentsStorageService: Pick<StorageService, 'fileExists'>;
  logger?: Logger;
}): CreateDocumentStorageKey {
  const {
    useLegacyStorageKeyDefinitionSystem,
    storageKeyPattern,
    enableRandomSuffixFallback,
    maxIncrementalSuffixAttempts,
  } = storagePatternConfig;

  return async ({ now = new Date(), ...documentContext }) => {
    if (useLegacyStorageKeyDefinitionSystem) {
      const { originalDocumentStorageKey } = buildOriginalDocumentKey({
        documentId: documentContext.documentId,
        fileName: documentContext.documentName,
        organizationId: documentContext.organizationId,
      });

      return { storageKey: originalDocumentStorageKey };
    }

    const context = await resolveStoragePatternContext({
      storageKeyPattern,
      ...documentContext,
      now,
    });
    const { storageKey: initialStorageKey } = buildStorageKey({ storageKeyPattern, ...context });

    return ensureStorageKeyIsAvailable({
      initialStorageKey,
      maxIncrementalSuffixAttempts,
      enableRandomSuffixFallback,
      storageService: documentsStorageService,
      logger,
    });
  };
}
