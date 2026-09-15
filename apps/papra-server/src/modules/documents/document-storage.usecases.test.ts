import type { StoragePatternConfig } from './storage-patterns/storage-pattern.types';
import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test, vi } from 'vitest';
import { createDocumentStorageKey } from './document-storage.usecases';

const baseStoragePatternConfig = {
  useLegacyStorageKeyDefinitionSystem: false,
  storageKeyPattern: '{{organization.id}}/{{document.name}}',
  enableRandomSuffixFallback: true,
  maxIncrementalSuffixAttempts: 9,
} satisfies StoragePatternConfig;

const documentContext = {
  documentId: 'doc_1',
  documentName: 'invoice.pdf',
  organizationId: 'org_1',
  now: new Date('2026-01-01T00:00:00.000Z'),
};

describe('document-storage usecases', () => {
  describe('createDocumentStorageKey', () => {
    test('uses the legacy document key without checking for collisions', async () => {
      const fileExists = vi.fn(async () => false);

      await expect(
        createDocumentStorageKey({
          ...documentContext,
          storagePatternConfig: {
            ...baseStoragePatternConfig,
            useLegacyStorageKeyDefinitionSystem: true,
          },
          documentsStorageService: { fileExists },
          logger: createNoopLogger(),
        }),
      ).resolves.toEqual({ storageKey: 'org_1/originals/doc_1.pdf' });
      expect(fileExists).not.toHaveBeenCalled();
    });

    test('interpolates the document pattern and resolves collisions with incremental suffixes', async () => {
      const fileExists = vi.fn(
        async ({ storageKey }: { storageKey: string }) => storageKey === 'org_1/invoice.pdf',
      );

      await expect(
        createDocumentStorageKey({
          ...documentContext,
          storagePatternConfig: baseStoragePatternConfig,
          documentsStorageService: { fileExists },
          logger: createNoopLogger(),
        }),
      ).resolves.toEqual({ storageKey: 'org_1/invoice_1.pdf' });
      expect(fileExists).toHaveBeenNthCalledWith(1, { storageKey: 'org_1/invoice.pdf' });
      expect(fileExists).toHaveBeenNthCalledWith(2, { storageKey: 'org_1/invoice_1.pdf' });
    });

    test('uses the random suffix fallback after incremental attempts are exhausted', async () => {
      const fileExists = vi
        .fn<({ storageKey }: { storageKey: string }) => Promise<boolean>>()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await createDocumentStorageKey({
        ...documentContext,
        storagePatternConfig: {
          ...baseStoragePatternConfig,
          maxIncrementalSuffixAttempts: 0,
        },
        documentsStorageService: { fileExists },
        logger: createNoopLogger(),
      });

      expect(result.storageKey).toMatch(/^org_1\/invoice_[A-Za-z0-9]{8}\.pdf$/);
      expect(fileExists).toHaveBeenCalledTimes(2);
      expect(fileExists).toHaveBeenNthCalledWith(1, { storageKey: 'org_1/invoice.pdf' });
      expect(fileExists).toHaveBeenNthCalledWith(2, { storageKey: result.storageKey });
    });
  });
});
