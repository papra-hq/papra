import type { Logger } from '../shared/logger/logger';
import type { StorageService } from './drivers/drivers.models';
import { createLogger } from '../shared/logger/logger';
import { generateRandomString } from '../shared/random/random.services';
import { createUnableToFindAvailableStorageKeyError } from './storage.errors';
import { addSuffixToStorageKey } from './storage.models';

export async function ensureStorageKeyIsAvailable({
  initialStorageKey,
  maxIncrementalSuffixAttempts,
  enableRandomSuffixFallback,
  generateRandomSuffix = () => generateRandomString({ length: 8 }),
  storageService,
  logger = createLogger({ namespace: 'ensureStorageKeyIsAvailable' }),
}: {
  initialStorageKey: string;
  maxIncrementalSuffixAttempts: number;
  enableRandomSuffixFallback: boolean;
  generateRandomSuffix?: () => string;
  storageService: Pick<StorageService, 'fileExists'>;
  logger?: Logger;
}): Promise<{ storageKey: string }> {
  let proposedStorageKey = initialStorageKey;
  let counter = 0;

  const logMeta = { initialStorageKey, maxIncrementalSuffixAttempts, enableRandomSuffixFallback };

  while (counter <= maxIncrementalSuffixAttempts) {
    const exists = await storageService.fileExists({ storageKey: proposedStorageKey });

    if (!exists) {
      return { storageKey: proposedStorageKey };
    }

    logger.warn({ ...logMeta, proposedStorageKey, counter }, 'Storage key is already taken');

    proposedStorageKey = addSuffixToStorageKey({
      storageKey: initialStorageKey,
      suffix: counter + 1,
    });
    counter++;
  }

  if (enableRandomSuffixFallback) {
    const randomSuffix = generateRandomSuffix();
    proposedStorageKey = addSuffixToStorageKey({
      storageKey: initialStorageKey,
      suffix: randomSuffix,
    });

    logger.warn({ ...logMeta, proposedStorageKey, randomSuffix }, 'Falling back to random suffix');

    const exists = await storageService.fileExists({ storageKey: proposedStorageKey });

    if (!exists) {
      return { storageKey: proposedStorageKey };
    }
  }

  logger.error({ ...logMeta }, 'Unable to find available storage key after all attempts');
  throw createUnableToFindAvailableStorageKeyError();
}
