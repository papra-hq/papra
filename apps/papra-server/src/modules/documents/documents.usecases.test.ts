import type { Config } from '../config/config.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { collectReadableStreamToString } from '../shared/streams/readable-stream';
import { createDocumentsRepository } from './documents.repository';
import { documentsTable } from './documents.table';
import { createDocument } from './documents.usecases';
import { createDocumentStorageService } from './storage/documents.storage.services';

describe('documents usecases', () => {
  describe('createDocument', () => {
    test('creating a document save the file to the storage and registers a record in the db', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationUsers: [{ organizationId: 'organization-1', userId: 'user-1' }],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
      const generateDocumentId = () => 'doc_1';

      const file = new File(['content'], 'file.txt', { type: 'text/plain' });
      const userId = 'user-1';
      const organizationId = 'organization-1';

      const { document } = await createDocument({
        file,
        userId,
        organizationId,
        documentsRepository,
        documentsStorageService,
        generateDocumentId,
      });

      expect(document).to.include({
        id: 'doc_1',
        organizationId: 'organization-1',
        createdBy: 'user-1',
        name: 'file.txt',
        originalName: 'file.txt',
        originalSize: 7,
        originalStorageKey: 'organization-1/originals/doc_1.txt',
        mimeType: 'text/plain',
        deletedBy: null,
        deletedAt: null,
      });

      // Ensure the file content is saved in the storage
      const { fileStream } = await documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_1.txt' });
      const content = await collectReadableStreamToString({ stream: fileStream });

      expect(content).to.eql('content');

      // Ensure the document record is saved in the database
      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords).to.eql([document]);
    });
  });
});
