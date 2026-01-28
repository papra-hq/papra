import type { PlansRepository } from '../plans/plans.repository';
import type { DocumentStorageService } from './storage/documents.storage.services';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createOrganizationDocumentStorageLimitReachedError } from '../organizations/organizations.errors';
import { createDeterministicIdGenerator } from '../shared/random/ids';
import { collectReadableStreamToString, createReadableStream } from '../shared/streams/readable-stream';
import { createTaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable } from '../tags/tags.table';
import { createInMemoryTaskServices } from '../tasks/tasks.test-utils';
import { createWebhookRepository } from '../webhooks/webhook.repository';
import { createDocumentActivityRepository } from './document-activity/document-activity.repository';
import { createDocumentAlreadyExistsError, createDocumentSizeTooLargeError } from './documents.errors';
import { createDocumentsRepository } from './documents.repository';
import { documentsTable } from './documents.table';
import { createDocumentCreationUsecase, extractAndSaveDocumentFileContent, restoreDocument, trashDocument, updateDocument } from './documents.usecases';
import { createDocumentStorageService } from './storage/documents.storage.services';
import { inMemoryStorageDriverFactory } from './storage/drivers/memory/memory.storage-driver';

describe('documents usecases', () => {
  describe('createDocument', () => {
    test('creating a document save the file to the storage and registers a record in the db', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
        documentsStorage: { driver: 'in-memory' },
      });
      const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });

      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        generateDocumentId: () => 'doc_1',
        documentsStorageService,
        taskServices,
        eventServices: createTestEventServices(),
      });

      const userId = 'user-1';
      const organizationId = 'organization-1';

      const { document } = await createDocument({
        fileStream: createReadableStream({ content: 'Hello, world!' }),
        fileName: 'file.txt',
        mimeType: 'text/plain',
        userId,
        organizationId,
      });

      expect(document).to.include({
        id: 'doc_1',
        organizationId: 'organization-1',
        createdBy: 'user-1',
        name: 'file.txt',
        originalName: 'file.txt',
        originalSize: 13,
        originalStorageKey: 'organization-1/originals/doc_1.txt',
        mimeType: 'text/plain',
        originalSha256Hash: '315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3',
        deletedBy: null,
        deletedAt: null,
      });

      // Ensure the file content is saved in the storage
      const { fileStream } = await documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_1.txt' });
      const content = await collectReadableStreamToString({ stream: fileStream });

      expect(content).to.eql('Hello, world!');

      // Ensure the document record is saved in the database
      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords).to.eql([document]);
    });

    test('in the same organization, we should not be able to have two documents with the same content, an error is raised if the document already exists', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
        documentsStorage: { driver: 'in-memory' },
      });

      const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });

      let documentIdIndex = 1;
      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        generateDocumentId: () => `doc_${documentIdIndex++}`,
        documentsStorageService,
        taskServices,
        eventServices: createTestEventServices(),
      });

      const userId = 'user-1';
      const organizationId = 'organization-1';

      const { document: document1 } = await createDocument({
        fileStream: createReadableStream({ content: 'Hello, world!' }),
        fileName: 'file.txt',
        mimeType: 'text/plain',
        userId,
        organizationId,
      });

      expect(document1).to.include({
        id: 'doc_1',
        organizationId: 'organization-1',
        createdBy: 'user-1',
        name: 'file.txt',
        originalName: 'file.txt',
        originalSha256Hash: '315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3',
      });

      const { fileStream: fileStream1 } = await documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_1.txt' });
      const content1 = await collectReadableStreamToString({ stream: fileStream1 });

      expect(content1).to.eql('Hello, world!');

      await expect(
        createDocument({
          fileStream: createReadableStream({ content: 'Hello, world!' }),
          fileName: 'file.txt',
          mimeType: 'text/plain',
          userId,
          organizationId,
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

    test(`if the document already exists but is in the trash
          - we restore the document
          - update the existing record, setting the name to the new file name (same content does not mean same name)
          - pre-existing tags are removed
          - the tagging rules are applied to the restored document`, async () => {
      // this is the sha256 hash of 'Hello, world!'
      const hash = '315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3';

      // The document is deleted and has the tag-1
      // A tagging rule that apply tag-2 if the content contains 'hello'
      // When restoring the document, the tagging rule should apply tag-2
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        tags: [
          { id: 'tag-1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'organization-1' },
          { id: 'tag-2', name: 'Tag 2', normalizedName: 'tag 2', color: '#000000', organizationId: 'organization-1' },
        ],
        documents: [{
          id: 'document-1',
          organizationId: 'organization-1',
          originalSha256Hash: hash,
          isDeleted: true,
          mimeType: 'text/plain',
          originalStorageKey: 'organization-1/originals/document-1.txt',
          name: 'file-1.txt',
          originalName: 'file-1.txt',
          content: 'Hello, world!',
        }],
        documentsTags: [{
          documentId: 'document-1',
          tagId: 'tag-1',
        }],
        taggingRules: [
          { id: 'tagging-rule-1', organizationId: 'organization-1', name: 'Tagging Rule 1', enabled: true },
        ],
        taggingRuleConditions: [
          { id: 'tagging-rule-condition-1', taggingRuleId: 'tagging-rule-1', field: 'content', operator: 'contains', value: 'hello' },
        ],
        taggingRuleActions: [
          { id: 'tagging-rule-action-1', taggingRuleId: 'tagging-rule-1', tagId: 'tag-2' },
        ],
      });

      const taskServices = createInMemoryTaskServices();

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
      });

      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        taskServices,
        documentsStorageService: inMemoryStorageDriverFactory(),
        eventServices: createTestEventServices(),
      });

      // 3. Re-create the document
      const { document: documentRestored } = await createDocument({
        fileStream: createReadableStream({ content: 'Hello, world!' }),
        fileName: 'file-2.txt',
        mimeType: 'text/plain',
        organizationId: 'organization-1',
      });

      expect(documentRestored).to.deep.include({
        id: 'document-1',
        organizationId: 'organization-1',
        name: 'file-2.txt',
        originalName: 'file-2.txt',
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
      });

      const documentsRecordsAfterRestoration = await db.select().from(documentsTable);

      expect(documentsRecordsAfterRestoration.length).to.eql(1);

      expect(documentsRecordsAfterRestoration[0]).to.eql(documentRestored);

      const documentsTagsRecordsAfterRestoration = await db.select().from(documentsTagsTable);

      expect(documentsTagsRecordsAfterRestoration).to.eql([{
        documentId: 'document-1',
        tagId: 'tag-2',
      }]);
    });

    test('when restoring a deleted document via duplicate upload, the optimistically saved new file should be cleaned up to prevent orphan files', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
        documentsStorage: { driver: 'in-memory' },
      });
      const documentsRepository = createDocumentsRepository({ db });
      const inMemoryDocumentsStorageService = inMemoryStorageDriverFactory();

      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        generateDocumentId: createDeterministicIdGenerator({ prefix: 'doc' }),
        documentsStorageService: inMemoryDocumentsStorageService,
        taskServices,
        eventServices: createTestEventServices(),
      });

      const userId = 'user-1';
      const organizationId = 'organization-1';

      // Step 1: Upload a file
      const { document: document1 } = await createDocument({
        fileStream: createReadableStream({ content: 'Hello, world!' }),
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
        userId,
        organizationId,
      });

      expect(document1.id).to.eql('doc_000000000000000000000001');
      expect(
        Array.from(inMemoryDocumentsStorageService._getStorage().keys()),
      ).to.eql([
        'organization-1/originals/doc_000000000000000000000001.pdf',
      ]);

      // Step 2: Delete the document (soft delete)
      await trashDocument({
        documentId: document1.id,
        organizationId,
        userId,
        documentsRepository,
        eventServices: createTestEventServices(),
      });

      const { document: trashedDoc } = await documentsRepository.getDocumentById({ documentId: document1.id, organizationId });
      expect(trashedDoc?.isDeleted).to.eql(true);

      // Step 3: Upload the same file again - this should restore the original document
      const { document: restoredDocument } = await createDocument({
        fileStream: createReadableStream({ content: 'Hello, world!' }),
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
        userId,
        organizationId,
      });

      // The document should be restored (same ID)
      expect(restoredDocument.id).to.eql('doc_000000000000000000000001');
      expect(restoredDocument.isDeleted).to.eql(false);

      // Step 5: Verify no orphan files remain in storage
      // The optimistically saved file (doc_2.pdf) should have been cleaned up during restoration
      expect(
        Array.from(inMemoryDocumentsStorageService._getStorage().keys()),
      ).to.eql([
        'organization-1/originals/doc_000000000000000000000001.pdf',
      ]);
    });

    test('when there is an issue when inserting the document in the db, the file should not be saved in the storage', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
        documentsStorage: { driver: 'in-memory' },
      });

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });

      const createDocument = createDocumentCreationUsecase({
        documentsStorageService,
        db,
        config,
        generateDocumentId: () => 'doc_1',
        documentsRepository: {
          ...documentsRepository,
          saveOrganizationDocument: async () => {
            throw new Error('Macron, explosion!');
          },
        },
        taskServices,
        eventServices: createTestEventServices(),
      });

      const userId = 'user-1';
      const organizationId = 'organization-1';

      await expect(
        createDocument({
          fileStream: createReadableStream({ content: 'Hello, world!' }),
          fileName: 'file.txt',
          mimeType: 'text/plain',
          userId,
          organizationId,
        }),
      ).rejects.toThrow(new Error('Macron, explosion!'));

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords).to.eql([]);

      await expect(
        documentsStorageService.getFileStream({ storageKey: 'organization-1/originals/doc_1.txt' }),
      ).rejects.toThrow('File not found');
    });

    test('if the document size exceeds the organization storage limit, an error is thrown and nothing is saved in the db', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const inMemoryDocumentsStorageService = inMemoryStorageDriverFactory();

      const plansRepository = {
        getOrganizationPlanById: async _args => ({
          organizationPlan: {
            limits: {
              maxDocumentStorageBytes: 100, // 100 bytes
            },
          },
        }),
      } as PlansRepository;

      const createDocument = createDocumentCreationUsecase({
        db,
        config: overrideConfig(),
        taskServices,
        plansRepository,
        documentsStorageService: inMemoryDocumentsStorageService,
        eventServices: createTestEventServices(),
      });

      await expect(
        createDocument({
          fileStream: createReadableStream({ content: 'Lorem ipsum'.repeat(100) }), // Greater than 100 bytes
          fileName: 'file.txt',
          mimeType: 'text/plain',
          userId: 'user-1',
          organizationId: 'organization-1',
        }),
      ).rejects.toThrow(createOrganizationDocumentStorageLimitReachedError());

      // Ensure no document is saved in the db
      const documentRecords = await db.select().from(documentsTable);
      expect(documentRecords.length).to.eql(0);

      // Ensure no file is saved in the storage
      expect(inMemoryDocumentsStorageService._getStorage().size).to.eql(0);
    });

    test('when on the verge of reaching the organization storage limit, if multiple documents, with the sum of the size exceeding the limit, are uploaded at the same time, the quota is not exceeded and only the first to be inserted is saved', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      // Quota is 100 bytes
      // Upload file-1.txt (60 bytes) ------####################---->
      // Upload file-2.txt (60 bytes) ------------###########------->

      const { promise, resolve } = Promise.withResolvers();

      const inMemoryDocumentsStorageService = inMemoryStorageDriverFactory();
      const documentsStorageService = {
        ...inMemoryDocumentsStorageService,
        saveFile: async (args) => {
          const { fileName } = args;

          // To ensure parallelism in tests, we pause the ingestion of the first file to wait for the second file to be ingested
          if (fileName === 'file-1.txt') {
            await promise;
          }

          return inMemoryDocumentsStorageService.saveFile(args);
        },
      } as DocumentStorageService;

      const plansRepository = {
        getOrganizationPlanById: async _args => ({
          organizationPlan: {
            limits: {
              maxDocumentStorageBytes: 100, // 100 bytes
            },
          },
        }),
      } as PlansRepository;

      const createDocument = createDocumentCreationUsecase({
        db,
        config: overrideConfig(),
        taskServices,
        plansRepository,
        documentsStorageService,
        eventServices: createTestEventServices(),
      });

      const [result1, result2] = await Promise.allSettled([
        createDocument({
          fileStream: createReadableStream({ content: 'A'.repeat(60) }),
          fileName: 'file-1.txt',
          mimeType: 'text/plain',
          userId: 'user-1',
          organizationId: 'organization-1',
        }),

        createDocument({
          fileStream: createReadableStream({ content: 'B'.repeat(60) }),
          fileName: 'file-2.txt',
          mimeType: 'text/plain',
          organizationId: 'organization-1',
        }).then(resolve),
      ]);

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords.length).to.eql(1);
      expect(documentRecords[0]).to.deep.include({
        organizationId: 'organization-1',
        name: 'file-2.txt',
      });

      expect(result1).to.deep.include({ status: 'rejected', reason: createOrganizationDocumentStorageLimitReachedError() });
      expect(result2).to.deep.include({ status: 'fulfilled' });
    });

    test('when a document is created that exceeds the file size limit, an error is thrown and nothing is saved in the db', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const inMemoryDocumentsStorageService = inMemoryStorageDriverFactory();

      const plansRepository = {
        getOrganizationPlanById: async _args => ({
          organizationPlan: {
            limits: {
              maxDocumentStorageBytes: 1_000, // 1kiB
              maxFileSize: 100, // 100 bytes
            },
          },
        }),
      } as PlansRepository;

      const createDocument = createDocumentCreationUsecase({
        db,
        config: overrideConfig(),
        taskServices,
        plansRepository,
        documentsStorageService: inMemoryDocumentsStorageService,
        eventServices: createTestEventServices(),
      });

      await expect(
        createDocument({
          fileStream: createReadableStream({ content: 'A'.repeat(101) }),
          fileName: 'file-1.txt',
          mimeType: 'text/plain',
          userId: 'user-1',
          organizationId: 'organization-1',
        }),
      ).rejects.toThrow(createDocumentSizeTooLargeError());

      // Ensure no document is saved in the db
      const documentRecords = await db.select().from(documentsTable);
      expect(documentRecords.length).to.eql(0);

      // Ensure no file is saved in the storage
      expect(inMemoryDocumentsStorageService._getStorage().size).to.eql(0);
    });

    test('when a document is added, a "document.created" event is triggered', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
      });

      let documentIdIndex = 1;
      const eventServices = createTestEventServices();
      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        generateDocumentId: () => `doc_${documentIdIndex++}`,
        documentsStorageService: inMemoryStorageDriverFactory(),
        taskServices,
        eventServices,
      });

      await createDocument({
        fileStream: createReadableStream({ content: 'content-1' }),
        fileName: 'file.txt',
        mimeType: 'text/plain',
        userId: 'user-1',
        organizationId: 'organization-1',
      });

      const emittedEvents = eventServices.getEmittedEvents();

      expect(emittedEvents.length).to.eql(1);
      const { eventName, payload } = emittedEvents[0]!;

      expect(eventName).to.eql('document.created');
      expect(payload.document).to.include({
        id: 'doc_1',
        organizationId: 'organization-1',
        createdBy: 'user-1',
        name: 'file.txt',
        originalName: 'file.txt',
        originalSize: 9,
        mimeType: 'text/plain',
      });
    });
  });

  describe('extractAndSaveDocumentFileContent', () => {
    test('given a stored document, its content is extracted and saved in the db', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
        documentsStorage: { driver: 'in-memory' },
      });

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      await db.insert(documentsTable).values({
        id: 'document-1',
        organizationId: 'organization-1',
        originalStorageKey: 'organization-1/originals/document-1.txt',
        mimeType: 'text/plain',
        name: 'file-1.txt',
        originalName: 'file-1.txt',
        originalSha256Hash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      });

      await documentsStorageService.saveFile({
        fileStream: createReadableStream({ content: 'hello world' }),
        fileName: 'file-1.txt',
        mimeType: 'text/plain',
        storageKey: 'organization-1/originals/document-1.txt',
      });

      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await extractAndSaveDocumentFileContent({
        documentId: 'document-1',
        organizationId: 'organization-1',
        documentsRepository,
        documentsStorageService,
        taggingRulesRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
        eventServices: createTestEventServices(),
      });

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords.length).to.eql(1);
      expect(documentRecords[0]).to.deep.include({
        id: 'document-1',
        organizationId: 'organization-1',
        content: 'hello world', // The content is extracted and saved in the db
      });
    });

    test('a document.updated event is emitted when the document content is extracted and saved', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
        documentsStorage: { driver: 'in-memory' },
      });

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      await db.insert(documentsTable).values({
        id: 'document-1',
        organizationId: 'organization-1',
        originalStorageKey: 'organization-1/originals/document-1.txt',
        mimeType: 'text/plain',
        name: 'file-1.txt',
        originalName: 'file-1.txt',
        originalSha256Hash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      });

      await documentsStorageService.saveFile({
        fileStream: createReadableStream({ content: 'hello world' }),
        fileName: 'file-1.txt',
        mimeType: 'text/plain',
        storageKey: 'organization-1/originals/document-1.txt',
      });

      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });
      const eventServices = createTestEventServices();

      await extractAndSaveDocumentFileContent({
        documentId: 'document-1',
        organizationId: 'organization-1',
        documentsRepository,
        documentsStorageService,
        taggingRulesRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
        eventServices,
      });

      expect(
        eventServices.getEmittedEvents().map(({ eventName }) => (eventName)),
      ).to.eql([
        'document.updated',
      ]);
    });
  });

  describe('trashDocument', () => {
    test('users can soft delete a document by moving it to the trash', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        documents: [{
          id: 'document-1',
          organizationId: 'organization-1',
          mimeType: 'text/plain',
          originalStorageKey: 'organization-1/originals/document-1.txt',
          name: 'file-1.txt',
          originalName: 'file-1.txt',
          originalSha256Hash: 'hash',
        }],
      });

      const documentsRepository = createDocumentsRepository({ db });

      await trashDocument({
        documentId: 'document-1',
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        eventServices: createTestEventServices(),
      });

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords.length).to.eql(1);
      expect(documentRecords[0]).to.deep.include({
        id: 'document-1',
        organizationId: 'organization-1',
        isDeleted: true,
        deletedBy: 'user-1',
      });
    });

    test('when a document is trashed, a "document.trashed" event is triggered', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        documents: [{
          id: 'document-1',
          organizationId: 'organization-1',
          mimeType: 'text/plain',
          originalStorageKey: 'organization-1/originals/document-1.txt',
          name: 'file-1.txt',
          originalName: 'file-1.txt',
          originalSha256Hash: 'hash',
        }],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const eventServices = createTestEventServices();

      await trashDocument({
        documentId: 'document-1',
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        eventServices,
      });

      const emittedEvents = eventServices.getEmittedEvents();

      expect(emittedEvents.length).to.eql(1);
      const { eventName, payload } = emittedEvents[0]!;

      expect(eventName).to.eql('document.trashed');
      expect(payload).to.deep.include({
        documentId: 'document-1',
        organizationId: 'organization-1',
        trashedBy: 'user-1',
      });
    });
  });

  describe('restoreDocument', () => {
    test('users can restore a document from the trash, the document is no longer marked as deleted and the deletedBy and deletedAt fields are cleared', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        documents: [{
          id: 'document-1',
          organizationId: 'organization-1',
          mimeType: 'text/plain',
          originalStorageKey: 'organization-1/originals/document-1.txt',
          name: 'file-1.txt',
          originalName: 'file-1.txt',
          originalSha256Hash: 'hash',
          isDeleted: true,
          deletedBy: 'user-1',
        }],
      });

      const documentsRepository = createDocumentsRepository({ db });

      await restoreDocument({
        documentId: 'document-1',
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        eventServices: createTestEventServices(),
      });

      const documentRecords = await db.select().from(documentsTable);

      expect(documentRecords.length).to.eql(1);
      expect(documentRecords[0]).to.deep.include({
        id: 'document-1',
        organizationId: 'organization-1',
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
      });
    });

    test('when a document is restored, a "document.restored" event is triggered', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        documents: [{
          id: 'document-1',
          organizationId: 'organization-1',
          mimeType: 'text/plain',
          originalStorageKey: 'organization-1/originals/document-1.txt',
          name: 'file-1.txt',
          originalName: 'file-1.txt',
          originalSha256Hash: 'hash',
          isDeleted: true,
          deletedBy: 'user-1',
        }],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const eventServices = createTestEventServices();

      await restoreDocument({
        documentId: 'document-1',
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        eventServices,
      });

      expect(
        eventServices.getEmittedEvents(),
      ).to.eql([{
        eventName: 'document.restored',
        payload: {
          documentId: 'document-1',
          organizationId: 'organization-1',
          restoredBy: 'user-1',
        },
      }]);
    });
  });

  describe('updateDocument', () => {
    test('when a document is updated, a "document.updated" event is triggered', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        documents: [{
          id: 'document-1',
          organizationId: 'organization-1',
          mimeType: 'text/plain',
          originalStorageKey: 'organization-1/originals/document-1.txt',
          name: 'file-1.txt',
          originalName: 'file-1.txt',
          originalSha256Hash: 'hash',
          content: 'Original content',
          createdAt: new Date('2025-12-10'),
          updatedAt: new Date('2025-12-11'),
        }],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const eventServices = createTestEventServices();

      await updateDocument({
        documentId: 'document-1',
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        eventServices,
        changes: { name: 'new-name.txt', content: 'Updated content' },
      });

      expect(
        eventServices.getEmittedEvents(),
      ).to.eql(
        [
          {
            eventName: 'document.updated',
            payload: {
              changes: {
                content: 'Updated content',
                name: 'new-name.txt',
              },
              document: {
                content: 'Updated content',
                createdAt: new Date('2025-12-10'),
                createdBy: null,
                deletedAt: null,
                deletedBy: null,
                fileEncryptionAlgorithm: null,
                fileEncryptionKekVersion: null,
                fileEncryptionKeyWrapped: null,
                id: 'document-1',
                isDeleted: false,
                mimeType: 'text/plain',
                name: 'new-name.txt',
                organizationId: 'organization-1',
                originalName: 'file-1.txt',
                originalSha256Hash: 'hash',
                originalSize: 0,
                originalStorageKey: 'organization-1/originals/document-1.txt',
                updatedAt: new Date('2025-12-11'),
              },
              userId: 'user-1',
            },
          },
        ],
      );
    });
  });
});
