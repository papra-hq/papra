import type { Logger } from '../../shared/logger/logger';
import type { DocumentStorageService } from './documents.storage.services';
import type { StoragePatternConfig } from './patterns/storage-pattern.types';
import { createLogger } from '../../shared/logger/logger';
import { generateRandomString } from '../../shared/random/random.services';
import { buildOriginalDocumentKey } from '../documents.models';
import { createUnableToFindAvailableStorageKeyError } from './document-storage.errors';
import { addSuffixToFileName } from './document-storage.models';
import { buildStorageKey } from './patterns/storage-pattern.usecases';

export async function ensureStorageKeyIsAvailable({
  initialStorageKey,
  maxIncrementalSuffixAttempts,
  enableRandomSuffixFallback,

  generateRandomSuffix = () => generateRandomString({ length: 8 }),
  documentsStorageService,
  logger = createLogger({ namespace: 'ensureStorageKeyIsAvailable' }),
}: {
  initialStorageKey: string;
  maxIncrementalSuffixAttempts: number;
  enableRandomSuffixFallback: boolean;

  generateRandomSuffix?: () => string;
  documentsStorageService: Pick<DocumentStorageService, 'fileExists'>;
  logger?: Logger;
}): Promise<{ storageKey: string }> {
  let proposedStorageKey = initialStorageKey;
  let counter = 0;

  const logMeta = { initialStorageKey, maxIncrementalSuffixAttempts, enableRandomSuffixFallback };

  while (counter <= maxIncrementalSuffixAttempts) {
    const exists = await documentsStorageService.fileExists({ storageKey: proposedStorageKey });

    if (!exists) {
      return { storageKey: proposedStorageKey };
    }

    logger.warn({ ...logMeta, proposedStorageKey, counter }, 'Storage key is already taken');

    proposedStorageKey = addSuffixToFileName({ storageKey: initialStorageKey, suffix: counter + 1 }); // Suffixes start at 1
    counter++;
  }

  if (enableRandomSuffixFallback) {
    const randomSuffix = generateRandomSuffix();
    proposedStorageKey = addSuffixToFileName({ storageKey: initialStorageKey, suffix: randomSuffix });

    logger.warn({ ...logMeta, proposedStorageKey, randomSuffix }, 'Falling back to random suffix');

    const exists = await documentsStorageService.fileExists({ storageKey: proposedStorageKey });

    if (!exists) {
      return { storageKey: proposedStorageKey };
    }
  }

  logger.error({ ...logMeta }, 'Unable to find available storage key after all attempts');

  throw createUnableToFindAvailableStorageKeyError();
}

export async function createStorageKey({
  storagePatternConfig,
  documentId,
  documentName,
  organizationId,
  now = new Date(),
  documentsStorageService,
}: {
  storagePatternConfig: StoragePatternConfig;
  documentId: string;
  documentName: string;
  organizationId: string;
  now?: Date;
  documentsStorageService: Pick<DocumentStorageService, 'fileExists'>;
}) {
  const {
    useLegacyStorageKeyDefinitionSystem,
    storageKeyPattern,
    enableRandomSuffixFallback,
    maxIncrementalSuffixAttempts,
  } = storagePatternConfig;

  if (useLegacyStorageKeyDefinitionSystem) {
    const { originalDocumentStorageKey } = buildOriginalDocumentKey({ documentId, fileName: documentName, organizationId });

    return { storageKey: originalDocumentStorageKey };
  }

  const { storageKey: initialStorageKey } = buildStorageKey({ storageKeyPattern, documentId, documentName, organizationId, now });

  const { storageKey } = await ensureStorageKeyIsAvailable({
    initialStorageKey,
    maxIncrementalSuffixAttempts,
    enableRandomSuffixFallback,
    documentsStorageService,
  });

  return { storageKey };
}
