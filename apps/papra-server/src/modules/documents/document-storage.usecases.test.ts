import type { StoragePatternConfig } from './storage-patterns/storage-pattern.types';
import { Buffer } from 'node:buffer';
import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test, vi } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestClock } from '../shared/clock/clock.test-utils';
import {
  collectReadableStreamToString,
  createReadableStream,
} from '../shared/streams/readable-stream';
import { inMemoryStorageDriverFactory } from '../storage/drivers/memory/memory.storage-driver';
import { wrapWithEncryptionLayer } from '../storage/encryption/storage-encryption.services';
import { buildSyncDocumentStorageKey, createDocumentStorageKey } from './document-storage.usecases';
import { createDocumentsRepository } from './documents.repository';

const baseStoragePatternConfig = {
  isStorageKeySyncEnabled: true,
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

async function setupSync({ sourceStorageKey = 'old.pdf', isEncryptionEnabled = false } = {}) {
  const { db } = await createInMemoryDatabase({
    organizations: [{ id: 'org_1', name: 'Organization' }],
  });
  const documentsRepository = createDocumentsRepository({ db });
  const driver = inMemoryStorageDriverFactory();
  const documentsStorageService = wrapWithEncryptionLayer({
    storageDriver: driver,
    encryptionOptions: {
      isEncryptionEnabled,
      keyEncryptionKeys: [{ version: '1', key: Buffer.alloc(32, 1) }],
    },
  });
  const encryptionContext = await documentsStorageService.saveFile({
    storageKey: sourceStorageKey,
    fileName: 'old.pdf',
    mimeType: 'application/pdf',
    fileStream: createReadableStream({ content: 'document bytes' }),
  });
  const { document } = await documentsRepository.saveOrganizationDocument({
    id: 'doc_1',
    organizationId: 'org_1',
    name: 'invoice.pdf',
    originalName: 'old.pdf',
    originalStorageKey: sourceStorageKey,
    originalSha256Hash: 'hash',
    mimeType: 'application/pdf',
    ...encryptionContext,
  });
  const args = { documentId: document.id, organizationId: document.organizationId };
  const dependencies = {
    documentsRepository,
    documentsStorageService,
    storagePatternConfig: baseStoragePatternConfig,
    logger: createNoopLogger(),
  };
  return {
    args,
    document,
    dependencies,
    driver,
    getDocument: async () => (await documentsRepository.getDocumentById(args)).document,
    keys: () => [...driver._getStorage().keys()].sort(),
    sync: buildSyncDocumentStorageKey(dependencies),
  };
}

describe('syncDocumentStorageKey', () => {
  test('re-evaluates current dates and random expressions on subsequent updates', async () => {
    const { args, dependencies, keys, getDocument } = await setupSync();
    const { clock } = createTestClock({ now: '2026-01-01T00:00:00Z' });
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      clock,
      storagePatternConfig: {
        ...baseStoragePatternConfig,
        storageKeyPattern: '{{currentDate.yyyy}}/{{random}}/{{document.name}}',
      },
    });
    await sync(args);
    expect((await getDocument())?.originalStorageKey).toMatch(
      /^2026\/[A-Za-z0-9]{8}\/invoice\.pdf$/,
    );
    clock.setNow('2027-01-01T00:00:00Z');
    await sync(args);
    expect((await getDocument())?.originalStorageKey).toMatch(
      /^2027\/[A-Za-z0-9]{8}\/invoice\.pdf$/,
    );
    expect(keys()).toEqual([(await getDocument())?.originalStorageKey]);
  });

  test('a stale storage-key update cannot replace a newer database key or cross organizations', async () => {
    const { args, dependencies, document, getDocument } = await setupSync();
    const update = {
      ...args,
      sourceStorageKey: document.originalStorageKey,
      storageKey: 'newer.pdf',
      name: document.name,
      updatedAt: document.updatedAt,
    };
    expect(
      await dependencies.documentsRepository.updateDocumentStorageKey({
        ...update,
        organizationId: 'other_org',
      }),
    ).toEqual({ updated: false });
    expect(await dependencies.documentsRepository.updateDocumentStorageKey(update)).toEqual({
      updated: true,
    });
    expect(
      await dependencies.documentsRepository.updateDocumentStorageKey({
        ...update,
        storageKey: 'stale.pdf',
      }),
    ).toEqual({ updated: false });
    expect((await getDocument())?.originalStorageKey).toEqual('newer.pdf');
  });

  test('moves stored bytes and only changes the storage key, preserving encryption metadata', async () => {
    const { sync, args, document, getDocument, keys, driver, dependencies } = await setupSync({
      isEncryptionEnabled: true,
    });
    const ciphertext = driver._getStorage().get('old.pdf')!.content;

    await sync(args);

    expect(await getDocument()).toEqual({ ...document, originalStorageKey: 'org_1/invoice.pdf' });
    expect(keys()).toEqual(['org_1/invoice.pdf']);
    expect(driver._getStorage().get('org_1/invoice.pdf')!.content).toEqual(ciphertext);
    const { fileStream } = await dependencies.documentsStorageService.getFileStream({
      storageKey: 'org_1/invoice.pdf',
      ...document,
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual('document bytes');
  });

  test('is opt-in and does not synchronize legacy keys', async () => {
    const { args, dependencies, keys } = await setupSync();
    await buildSyncDocumentStorageKey({
      ...dependencies,
      storagePatternConfig: { ...baseStoragePatternConfig, isStorageKeySyncEnabled: false },
    })(args);
    await buildSyncDocumentStorageKey({
      ...dependencies,
      storagePatternConfig: {
        ...baseStoragePatternConfig,
        useLegacyStorageKeyDefinitionSystem: true,
      },
    })(args);
    expect(keys()).toEqual(['old.pdf']);
  });

  test('does not write storage when the key already matches', async () => {
    const { args, dependencies, document, getDocument } = await setupSync({
      sourceStorageKey: 'org_1/invoice.pdf',
    });
    const fail = async () => {
      throw new Error('unexpected storage access');
    };
    await buildSyncDocumentStorageKey({
      ...dependencies,
      documentsStorageService: { fileExists: fail, copyFile: fail, deleteFile: fail },
    })(args);
    expect(await getDocument()).toEqual(document);
  });

  test('moves an incremental-suffixed key to the unsuffixed key when available', async () => {
    const { sync, args, keys, getDocument } = await setupSync({
      sourceStorageKey: 'org_1/invoice_2.pdf',
    });
    await sync(args);
    expect(keys()).toEqual(['org_1/invoice.pdf']);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice.pdf');
  });

  test('moves a random-suffixed key to the unsuffixed key when available', async () => {
    const { sync, args, keys, getDocument } = await setupSync({
      sourceStorageKey: 'org_1/invoice_aB12cd34.pdf',
    });
    await sync(args);
    expect(keys()).toEqual(['org_1/invoice.pdf']);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice.pdf');
  });

  test('accepts repeated copies between suffixes while the unsuffixed key remains occupied', async () => {
    const { sync, args, dependencies, keys, getDocument } = await setupSync({
      sourceStorageKey: 'org_1/invoice_1.pdf',
    });
    await dependencies.documentsStorageService.saveFile({
      storageKey: 'org_1/invoice.pdf',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      fileStream: createReadableStream({ content: 'other document' }),
    });

    // Only exact matches skip synchronization. Extra copies are an accepted cost
    // of avoiding heuristics that infer collision suffixes from filenames.
    await sync(args);
    expect(keys()).toEqual(['org_1/invoice.pdf', 'org_1/invoice_2.pdf']);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice_2.pdf');

    await sync(args);
    expect(keys()).toEqual(['org_1/invoice.pdf', 'org_1/invoice_1.pdf']);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice_1.pdf');

    const { fileStream } = await dependencies.documentsStorageService.getFileStream({
      storageKey: 'org_1/invoice_1.pdf',
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual('document bytes');
    const { fileStream: otherFileStream } =
      await dependencies.documentsStorageService.getFileStream({
        storageKey: 'org_1/invoice.pdf',
      });
    expect(await collectReadableStreamToString({ stream: otherFileStream })).toEqual(
      'other document',
    );
  });

  test('resolves collisions without replacing another stored file', async () => {
    const { sync, args, dependencies, keys, getDocument } = await setupSync();
    await dependencies.documentsStorageService.saveFile({
      storageKey: 'org_1/invoice.pdf',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      fileStream: createReadableStream({ content: 'other document' }),
    });
    await sync(args);
    expect(keys()).toEqual(['org_1/invoice.pdf', 'org_1/invoice_1.pdf']);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice_1.pdf');
    const { fileStream } = await dependencies.documentsStorageService.getFileStream({
      storageKey: 'org_1/invoice.pdf',
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual('other document');
  });

  test('a failed copy retains the source and database key', async () => {
    const { args, dependencies, getDocument, document, keys } = await setupSync();
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      documentsStorageService: {
        ...dependencies.documentsStorageService,
        copyFile: async () => {
          throw new Error('copy failed');
        },
      },
    });
    await expect(sync(args)).rejects.toThrow('copy failed');
    expect(await getDocument()).toEqual(document);
    expect(keys()).toEqual(['old.pdf']);
  });

  test('a failed database update retains both files and does not block later synchronization', async () => {
    const { args, dependencies, getDocument, document, keys } = await setupSync();
    let fail = true;
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      documentsRepository: {
        ...dependencies.documentsRepository,
        updateDocumentStorageKey: async (input) => {
          if (fail) {
            throw new Error('database failed');
          }
          return dependencies.documentsRepository.updateDocumentStorageKey(input);
        },
      },
    });
    await expect(sync(args)).rejects.toThrow('database failed');
    expect(await getDocument()).toEqual(document);
    expect(keys()).toEqual(['old.pdf', 'org_1/invoice.pdf']);
    fail = false;
    await sync(args);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice_1.pdf');
    expect(keys()).toEqual(['org_1/invoice.pdf', 'org_1/invoice_1.pdf']);
  });

  test('a database error after committing retains the referenced destination and source', async () => {
    const { args, dependencies, getDocument, keys } = await setupSync();
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      documentsRepository: {
        ...dependencies.documentsRepository,
        updateDocumentStorageKey: async (input) => {
          await dependencies.documentsRepository.updateDocumentStorageKey(input);
          throw new Error('response lost after commit');
        },
      },
    });

    await expect(sync(args)).rejects.toThrow('response lost after commit');

    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice.pdf');
    expect(keys()).toEqual(['old.pdf', 'org_1/invoice.pdf']);
    const { fileStream } = await dependencies.documentsStorageService.getFileStream({
      storageKey: 'org_1/invoice.pdf',
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual('document bytes');
  });

  test('a lost database comparison retains the destination referenced by a winning update', async () => {
    const { args, dependencies, getDocument, keys } = await setupSync();
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      documentsRepository: {
        ...dependencies.documentsRepository,
        updateDocumentStorageKey: async (input) => {
          // Another handler publishes the shared destination and removes the source first.
          await dependencies.documentsRepository.updateDocumentStorageKey(input);
          await dependencies.documentsStorageService.deleteFile({
            storageKey: input.sourceStorageKey,
          });
          return dependencies.documentsRepository.updateDocumentStorageKey(input);
        },
      },
    });

    await sync(args);

    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice.pdf');
    expect(keys()).toEqual(['org_1/invoice.pdf']);
    const { fileStream } = await dependencies.documentsStorageService.getFileStream({
      storageKey: 'org_1/invoice.pdf',
    });
    expect(await collectReadableStreamToString({ stream: fileStream })).toEqual('document bytes');
  });

  test('a failed source cleanup keeps the working new key and logs the failure', async () => {
    const { args, dependencies, getDocument, keys } = await setupSync();
    const errors: unknown[] = [];
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      logger: {
        ...dependencies.logger,
        error: (...args) => {
          errors.push(args);
        },
      },
      documentsStorageService: {
        ...dependencies.documentsStorageService,
        deleteFile: async () => {
          throw new Error('delete failed');
        },
      },
    });
    await sync(args);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/invoice.pdf');
    expect(keys()).toEqual(['old.pdf', 'org_1/invoice.pdf']);
    expect(errors).toHaveLength(1);
  });

  test('overlapping updates publish the latest name and retain the stale copy', async () => {
    const { args, dependencies, getDocument, keys } = await setupSync();
    const copying = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    let copies = 0;
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      documentsStorageService: {
        ...dependencies.documentsStorageService,
        copyFile: async (input) => {
          copies++;
          await dependencies.documentsStorageService.copyFile(input);
          if (copies === 1) {
            copying.resolve();
            await resume.promise;
          }
        },
      },
    });
    const first = sync(args);
    await copying.promise;
    await dependencies.documentsRepository.updateDocument({ ...args, name: 'latest.pdf' });
    const second = sync(args);
    resume.resolve();
    await Promise.all([first, second]);
    expect((await getDocument())?.originalStorageKey).toEqual('org_1/latest.pdf');
    expect(keys()).toEqual(['org_1/invoice.pdf', 'org_1/latest.pdf']);
  });

  test('deletion during the copy rejects the database update and retains both files', async () => {
    const { args, dependencies, keys, getDocument } = await setupSync();
    const sync = buildSyncDocumentStorageKey({
      ...dependencies,
      documentsStorageService: {
        ...dependencies.documentsStorageService,
        copyFile: async (input) => {
          await dependencies.documentsStorageService.copyFile(input);
          await dependencies.documentsRepository.hardDeleteDocument(args);
        },
      },
    });
    await sync(args);
    expect(await getDocument()).toEqual(undefined);
    expect(keys()).toEqual(['old.pdf', 'org_1/invoice.pdf']);
  });

  test('a document deleted before handling is a no-op', async () => {
    const { sync, args, dependencies, keys } = await setupSync();
    await dependencies.documentsRepository.hardDeleteDocument(args);
    await sync(args);
    expect(keys()).toEqual(['old.pdf']);
  });
});

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
