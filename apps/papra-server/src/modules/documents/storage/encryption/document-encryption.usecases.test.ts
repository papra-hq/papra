import type { TaskServices } from '../../../tasks/tasks.services';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { createTestEventServices } from '../../../app/events/events.test-utils';
import { overrideConfig } from '../../../config/config.test-utils';
import { documentsTable } from '../../documents.table';
import { createDocumentCreationUsecase } from '../../documents.usecases';
import { createDocumentStorageServiceFromDriver } from '../documents.storage.services';
import { inMemoryStorageDriverFactory } from '../drivers/memory/memory.storage-driver';
import { encryptAllUnencryptedDocuments } from './document-encryption.usecases';

export const noopTaskServices = {
  scheduleJob: async _args => Promise.resolve({ jobId: '1' }),
} as TaskServices;

describe('document-encryption usecases', () => {
  describe('encryptAllUnencryptedDocuments', () => {
    test('given a papra instance with some encrypted and some unencrypted documents, it should encrypt all unencrypted documents', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Org 1' }],
      });

      const storageDriver = inMemoryStorageDriverFactory();

      const createDocumentWithoutEncryption = createDocumentCreationUsecase({
        db,
        config: overrideConfig(),
        taskServices: noopTaskServices,
        documentsStorageService: createDocumentStorageServiceFromDriver({
          storageDriver,
          encryptionConfig: {
            isEncryptionEnabled: false,
            documentKeyEncryptionKeys: [],
          },
        }),
        eventServices: createTestEventServices(),
      });

      const { document: document1 } = await createDocumentWithoutEncryption({
        fileName: 'Doc 1.txt',
        mimeType: 'text/plain',
        organizationId: 'org-1',
        fileStream: Readable.from(Buffer.from('Hello, world! - 1')),
      });

      const { document: document2 } = await createDocumentWithoutEncryption({
        fileName: 'Doc 2.txt',
        mimeType: 'text/plain',
        organizationId: 'org-1',
        fileStream: Readable.from(Buffer.from('Hello, world! - 2')),
      });

      const documentStorageServiceWithEncryption = createDocumentStorageServiceFromDriver({
        storageDriver,
        encryptionConfig: {
          isEncryptionEnabled: true,
          documentKeyEncryptionKeys: [{
            key: Buffer.from('64/4Ep2f/3ylsg9wIUeeZ7oIFPCyM6IaPjoLrhQCBSo=', 'base64'),
            version: '1',
          }],
        },
      });

      const createDocumentWithEncryption = createDocumentCreationUsecase({
        db,
        documentsStorageService: documentStorageServiceWithEncryption,
        config: overrideConfig(),
        taskServices: noopTaskServices,
        eventServices: createTestEventServices(),
      });

      const { document: document3 } = await createDocumentWithEncryption({
        fileName: 'Doc 3.txt',
        mimeType: 'text/plain',
        organizationId: 'org-1',
        fileStream: Readable.from(Buffer.from('Hello, world! - 3')),
      });

      // Ensure document 1 and 2 are readable while document 3 is not
      const storage = storageDriver._getStorage();

      expect(storage.get(document1.originalStorageKey)?.content.toString('utf-8')).toEqual('Hello, world! - 1');
      expect(storage.get(document2.originalStorageKey)?.content.toString('utf-8')).toEqual('Hello, world! - 2');
      // Encrypted document should start with PP01
      const encryptedDocument3 = storage.get(document3.originalStorageKey)?.content;
      expect(encryptedDocument3?.subarray(0, 4).toString('utf-8')).toEqual('PP01');

      await encryptAllUnencryptedDocuments({
        db,
        documentStorageService: documentStorageServiceWithEncryption,
      });

      // All documents should be encrypted

      const [newDocument1, newDocument2, newDocument3] = await db.select().from(documentsTable).orderBy(documentsTable.createdAt);

      expect(storage.get(newDocument1!.originalStorageKey)?.content.subarray(0, 4).toString('utf-8')).toEqual('PP01');
      expect(storage.get(newDocument2!.originalStorageKey)?.content.subarray(0, 4).toString('utf-8')).toEqual('PP01');
      expect(storage.get(newDocument3!.originalStorageKey)?.content.subarray(0, 4).toString('utf-8')).toEqual('PP01');

      // The document 3 should have the same original storage key
      expect(document3.originalStorageKey).to.eql(newDocument3!.originalStorageKey);
    });
  });
});
