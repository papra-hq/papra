import { describe, expect, test } from 'vitest';
import { createUnableToFindAvailableStorageKeyError } from './document-storage.errors';
import { ensureStorageKeyIsAvailable } from './document-storage.usecases';

describe('document-storage usecases', () => {
  describe('ensureStorageKeyIsAvailable', () => {
    test('when a given storage key is not already taken, the storage key is returned as is', async () => {
      expect(
        await ensureStorageKeyIsAvailable({
          initialStorageKey: 'path/to/file.txt',
          maxIncrementalSuffixAttempts: 3,
          enableRandomSuffixFallback: false,
          documentsStorageService: {
            fileExists: async () => false,
          },
        }),
      ).to.eql({ storageKey: 'path/to/file.txt' });
    });

    test('when the storage key is already taken, add incremental suffixes until an available storage key is found', async () => {
      expect(
        await ensureStorageKeyIsAvailable({
          initialStorageKey: 'path/to/file.txt',
          maxIncrementalSuffixAttempts: 3,
          enableRandomSuffixFallback: false,
          documentsStorageService: {
            fileExists: async ({ storageKey }) => ['path/to/file.txt', 'path/to/file_1.txt'].includes(storageKey),
          },
        }),
      ).to.eql({ storageKey: 'path/to/file_2.txt' });
    });

    test('when all incremental suffixes are taken and random suffix fallback is enabled, add a random suffix to find an available storage key', async () => {
      expect(
        await ensureStorageKeyIsAvailable({
          initialStorageKey: 'path/to/file.txt',
          maxIncrementalSuffixAttempts: 3,
          enableRandomSuffixFallback: true,
          generateRandomSuffix: () => 'random',
          documentsStorageService: {
            fileExists: async ({ storageKey }) => storageKey !== 'path/to/file_random.txt',
          },
        }),
      ).to.eql({ storageKey: 'path/to/file_random.txt' });
    });

    test('when all incremental suffixes are taken and random suffix fallback is disabled, throw an error', async () => {
      const pathsSet = new Set<string>([]);

      const args = {
        initialStorageKey: 'path/to/file.txt',
        maxIncrementalSuffixAttempts: 3,
        enableRandomSuffixFallback: false,
        documentsStorageService: {
          fileExists: async ({ storageKey }) => {
            if (pathsSet.has(storageKey)) {
              return true;
            }
            pathsSet.add(storageKey);
            return false;
          },
        },
      } as Parameters<typeof ensureStorageKeyIsAvailable>[0];

      expect(await ensureStorageKeyIsAvailable(args)).to.eql({ storageKey: 'path/to/file.txt' });
      expect(await ensureStorageKeyIsAvailable(args)).to.eql({ storageKey: 'path/to/file_1.txt' });
      expect(await ensureStorageKeyIsAvailable(args)).to.eql({ storageKey: 'path/to/file_2.txt' });
      expect(await ensureStorageKeyIsAvailable(args)).to.eql({ storageKey: 'path/to/file_3.txt' });
      await expect(ensureStorageKeyIsAvailable(args)).rejects.toThrow(createUnableToFindAvailableStorageKeyError());
    });

    test('if even the random suffix fallback is taken, throw an error', async () => {
      await expect(
        ensureStorageKeyIsAvailable({
          initialStorageKey: 'path/to/file.txt',
          maxIncrementalSuffixAttempts: 3,
          enableRandomSuffixFallback: true,
          generateRandomSuffix: () => 'random',
          documentsStorageService: {
            fileExists: async () => true,
          },
        }),
      ).rejects.toThrow(createUnableToFindAvailableStorageKeyError());
    });

    describe('the incremental suffix behavior can be disabled by setting a maximum number of incremental suffix attempts of 0', () => {
      test('the initial storage key is returned as is if it is available, but an error is thrown if it is taken and random suffix fallback is disabled', async () => {
        expect(
          await ensureStorageKeyIsAvailable({
            initialStorageKey: 'path/to/file.txt',
            maxIncrementalSuffixAttempts: 0,
            enableRandomSuffixFallback: false,
            documentsStorageService: {
              fileExists: async () => false,
            },
          }),
        ).to.eql({ storageKey: 'path/to/file.txt' });

        await expect(
          ensureStorageKeyIsAvailable({
            initialStorageKey: 'path/to/file.txt',
            maxIncrementalSuffixAttempts: 0,
            enableRandomSuffixFallback: false,
            documentsStorageService: {
              fileExists: async () => true,
            },
          }),
        ).rejects.toThrow(createUnableToFindAvailableStorageKeyError());
      });
    });
  });
});
