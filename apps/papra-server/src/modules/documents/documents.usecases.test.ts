import type { Config } from '../config/config.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLE_MEMBER } from '../organizations/organizations.constants';
import { collectReadableStreamToString } from '../shared/streams/readable-stream';
import { createDocumentAlreadyExistsError } from './documents.errors';
import { createDocumentsRepository } from './documents.repository';
import { documentsTable } from './documents.table';
import { createDocument } from './documents.usecases';
import { createDocumentStorageService } from './storage/documents.storage.services';

describe('documents usecases', () => {
  describe('createDocument', () => {
    test('creating a document save the file to the storage and registers a record in the db', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1', slug: 'organization-1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
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

    test('in the same organization, we should be able to have two documents with the same content, an error is raised if the document already exists', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1', slug: 'organization-1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
      let documentIdIndex = 1;
      const generateDocumentId = () => `doc_${documentIdIndex++}`;

      const file = new File(['content'], 'file.txt', { type: 'text/plain' });
      const userId = 'user-1';
      const organizationId = 'organization-1';

      const { document: document1 } = await createDocument({
        file,
        userId,
        organizationId,
        documentsRepository,
        documentsStorageService,
        generateDocumentId,
      });

      expect(document1).to.include({
        id: 'doc_1',
        organizationId: 'organization-1',
        createdBy: 'user-1',
        name: 'file.txt',
        originalName: 'file.txt',
      });

      const { fileStream: fileStream1 } = await documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_1.txt' });
      const content1 = await collectReadableStreamToString({ stream: fileStream1 });

      expect(content1).to.eql('content');

      await expect(
        createDocument({
          file,
          userId,
          organizationId,
          documentsRepository,
          documentsStorageService,
          generateDocumentId,
        }),
      ).rejects.toThrow(
        createDocumentAlreadyExistsError(),
      );

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords.map(({ id }) => id)).to.eql(['doc_1']);

      await expect(
        documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_2.txt' }),
      ).rejects.toThrow('File not found');
    });

    test('when there is an issue when inserting the document in the db, the file should not be saved in the storage', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1', slug: 'organization-1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
      const generateDocumentId = () => 'doc_1';

      const file = new File(['content'], 'file.txt', { type: 'text/plain' });
      const userId = 'user-1';
      const organizationId = 'organization-1';

      expect(
        createDocument({
          file,
          userId,
          organizationId,
          documentsRepository: {
            ...documentsRepository,
            saveOrganizationDocument: async () => {
              throw new Error('Macron, explosion!');
            },
          },
          documentsStorageService,
          generateDocumentId,
        }),
      ).rejects.toThrow(new Error('Macron, explosion!'));

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords).to.eql([]);

      await expect(
        documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_1.txt' }),
      ).rejects.toThrow('File not found');
    });
  });
});
