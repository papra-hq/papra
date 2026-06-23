import type { DocumentSearchServices } from '../document-search/document-search.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createTestEventServices } from '../../app/events/events.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { pick } from '../../shared/objects';
import { createTagsRepository } from '../../tags/tags.repository';
import { documentsTagsTable } from '../../tags/tags.table';
import { createDatabaseFts5DocumentSearchServices } from '../document-search/database-fts5/database-fts5.document-search-provider';
import { createDocumentsRepository } from '../documents.repository';
import { documentsTable } from '../documents.table';
import { createDocumentIdsNotFromOrganizationError } from './documents-batch.errors';
import {
  resolveBatchTargetDocumentIds,
  tagDocumentsBatch,
  trashDocumentsBatch,
} from './documents-batch.usecases';

function createStubSearchServices({ documentIds = [] }: { documentIds?: string[] } = {}) {
  const calls: Parameters<DocumentSearchServices['getDocumentIdsMatchingQuery']>[0][] = [];

  const services: DocumentSearchServices = {
    name: 'stub-search-service',
    searchDocuments: async () => ({ documents: [], documentsCount: 0 }),
    getDocumentIdsMatchingQuery: async (args) => {
      calls.push(args);
      return { documentIds };
    },
    indexDocuments: async () => {},
    updateDocuments: async () => {},
    deleteDocuments: async () => {},
  };

  return { services, calls };
}

const baseDocument = {
  organizationId: 'organization-1',
  mimeType: 'text/plain',
  originalStorageKey: 'organization-1/originals/document.txt',
  originalName: 'document.txt',
};

describe('documents-batch usecases', () => {
  describe('resolveBatchTargetDocumentIds', () => {
    test('returns the provided documentIds without invoking the search service', async () => {
      const { services, calls } = createStubSearchServices();
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          {
            ...baseDocument,
            id: 'doc-1',
            organizationId: 'organization-1',
            name: 'doc 1',
            originalSha256Hash: 'h1',
          },
          {
            ...baseDocument,
            id: 'doc-2',
            organizationId: 'organization-1',
            name: 'doc 2',
            originalSha256Hash: 'h2',
          },
        ],
      });

      const { documentIds } = await resolveBatchTargetDocumentIds({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        organizationId: 'organization-1',
        documentSearchServices: services,
        documentsRepository: createDocumentsRepository({ db }),
      });

      expect(documentIds).to.eql(['doc-1', 'doc-2']);
      expect(calls).to.eql([]);
    });

    test('throws an error if any of the provided documentIds do not belong to the organization', async () => {
      const { services } = createStubSearchServices();
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
        documents: [
          {
            ...baseDocument,
            id: 'doc-1',
            organizationId: 'organization-1',
            name: 'doc 1',
            originalSha256Hash: 'h1',
          },
          {
            ...baseDocument,
            id: 'doc-2',
            organizationId: 'organization-2',
            name: 'doc 2',
            originalSha256Hash: 'h2',
          },
        ],
      });

      await expect(
        resolveBatchTargetDocumentIds({
          filter: { documentIds: ['doc-1', 'doc-2'] },
          organizationId: 'organization-1',
          documentSearchServices: services,
          documentsRepository: createDocumentsRepository({ db }),
        }),
      ).rejects.toThrow(createDocumentIdsNotFromOrganizationError());
    });

    test('throws an error if a document id does not exist', async () => {
      const { services } = createStubSearchServices();
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          {
            ...baseDocument,
            id: 'doc-1',
            organizationId: 'organization-1',
            name: 'doc 1',
            originalSha256Hash: 'h1',
          },
        ],
      });

      await expect(
        resolveBatchTargetDocumentIds({
          filter: { documentIds: ['doc-1', 'doc-2'] },
          organizationId: 'organization-1',
          documentSearchServices: services,
          documentsRepository: createDocumentsRepository({ db }),
        }),
      ).rejects.toThrow(createDocumentIdsNotFromOrganizationError());
    });

    test('on the query path, delegates to the search service without enforcing a cap', async () => {
      const { services, calls } = createStubSearchServices({ documentIds: ['doc-1', 'doc-2'] });
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          {
            id: 'doc-1',
            ...baseDocument,
            name: 'doc 1',
            originalSha256Hash: 'h1',
            isDeleted: true,
            deletedBy: 'user-1',
            deletedAt: new Date('2026-01-01'),
          },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
      });

      const { documentIds } = await resolveBatchTargetDocumentIds({
        filter: { query: 'tag:invoice' },
        organizationId: 'organization-1',
        documentSearchServices: services,
        documentsRepository: createDocumentsRepository({ db }),
      });

      expect(documentIds).to.eql(['doc-1', 'doc-2']);
      expect(calls).to.eql([
        {
          organizationId: 'organization-1',
          searchQuery: 'tag:invoice',
        },
      ]);
    });
  });

  describe('trashDocumentsBatch', () => {
    test('trashes documents scoped to the organization, throws if any document does not belong to the organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
          {
            id: 'doc-3',
            organizationId: 'organization-2',
            mimeType: 'text/plain',
            originalStorageKey: 's3',
            originalName: 'doc 3',
            name: 'doc 3',
            originalSha256Hash: 'h3',
          },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const { services } = createStubSearchServices();

      await expect(
        trashDocumentsBatch({
          filter: { documentIds: ['doc-1', 'doc-3'] },
          organizationId: 'organization-1',
          userId: 'user-1',
          documentsRepository,
          documentSearchServices: services,
          eventServices: createTestEventServices(),
        }),
      ).rejects.toThrow(createDocumentIdsNotFromOrganizationError());

      const records = await db.select().from(documentsTable);
      const byId = Object.fromEntries(
        records.map((r) => [r.id, pick(r, ['id', 'isDeleted', 'deletedBy', 'deletedAt'])]),
      );
      expect(byId).to.eql({
        'doc-1': { id: 'doc-1', isDeleted: false, deletedBy: null, deletedAt: null },
        'doc-2': { id: 'doc-2', isDeleted: false, deletedBy: null, deletedAt: null },
        'doc-3': { id: 'doc-3', isDeleted: false, deletedBy: null, deletedAt: null },
      });
    });

    test('does not re-trash documents that are already in the trash', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          {
            id: 'doc-1',
            ...baseDocument,
            name: 'doc 1',
            originalSha256Hash: 'h1',
            isDeleted: true,
            deletedBy: 'user-1',
            deletedAt: new Date('2026-01-01'),
          },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const { services } = createStubSearchServices();

      const { trashedDocumentIds } = await trashDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        organizationId: 'organization-1',
        userId: 'user-2',
        documentsRepository,
        documentSearchServices: services,
        eventServices: createTestEventServices(),
      });

      expect(trashedDocumentIds).to.eql(['doc-2']);

      const records = await db.select().from(documentsTable);
      const byId = Object.fromEntries(records.map((r) => [r.id, r]));
      // doc-1 keeps its original deletedBy / deletedAt, untouched
      expect(byId['doc-1']?.deletedBy).to.eql('user-1');
      expect(byId['doc-1']?.deletedAt).to.eql(new Date('2026-01-01'));
      expect(byId['doc-2']?.isDeleted).to.eql(true);
      expect(byId['doc-2']?.deletedBy).to.eql('user-2');
    });

    test('emits a documents.trashed event with the actually trashed ids', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          {
            id: 'doc-2',
            ...baseDocument,
            name: 'doc 2',
            originalSha256Hash: 'h2',
            isDeleted: true,
            deletedBy: 'user-1',
          },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const { services } = createStubSearchServices();
      const eventServices = createTestEventServices();

      await trashDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        documentSearchServices: services,
        eventServices,
      });

      expect(eventServices.getEmittedEvents()).to.eql([
        {
          eventName: 'documents.trashed',
          payload: {
            documentIds: ['doc-1'],
            organizationId: 'organization-1',
            trashedBy: 'user-1',
          },
        },
      ]);
    });

    test('does not emit an event when no documents were trashed', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          {
            id: 'doc-1',
            ...baseDocument,
            name: 'doc 1',
            originalSha256Hash: 'h1',
            isDeleted: true,
            deletedBy: 'user-1',
          },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });
      const { services } = createStubSearchServices();
      const eventServices = createTestEventServices();

      const { trashedDocumentIds } = await trashDocumentsBatch({
        filter: { documentIds: ['doc-1'] },
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        documentSearchServices: services,
        eventServices,
      });

      expect(trashedDocumentIds).to.eql([]);
      expect(eventServices.getEmittedEvents()).to.eql([]);
    });

    test('resolves a search query to the matching documents and trashes them', async () => {
      const documents = [
        {
          id: 'doc-1',
          organizationId: 'organization-1',
          mimeType: 'application/pdf',
          originalStorageKey: '',
          originalName: 'invoice-1.pdf',
          name: 'invoice 1',
          originalSha256Hash: 'h1',
          content: 'tax invoice',
          isDeleted: false,
        },
        {
          id: 'doc-2',
          organizationId: 'organization-1',
          mimeType: 'application/pdf',
          originalStorageKey: '',
          originalName: 'invoice-2.pdf',
          name: 'invoice 2',
          originalSha256Hash: 'h2',
          content: 'tax invoice',
          isDeleted: false,
        },
        {
          id: 'doc-3',
          organizationId: 'organization-1',
          mimeType: 'application/pdf',
          originalStorageKey: '',
          originalName: 'memo.pdf',
          name: 'memo',
          originalSha256Hash: 'h3',
          content: 'meeting memo',
          isDeleted: false,
        },
      ];

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents,
      });

      const documentSearchServices = createDatabaseFts5DocumentSearchServices({ db });
      await documentSearchServices.indexDocuments({ documents });

      const documentsRepository = createDocumentsRepository({ db });

      const { trashedDocumentIds } = await trashDocumentsBatch({
        filter: { query: 'invoice' },
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        documentSearchServices,
        eventServices: createTestEventServices(),
      });

      expect(trashedDocumentIds.toSorted()).to.eql(['doc-1', 'doc-2']);

      const records = await db.select().from(documentsTable);
      const byId = Object.fromEntries(records.map((r) => [r.id, r]));
      expect(byId['doc-1']?.isDeleted).to.eql(true);
      expect(byId['doc-2']?.isDeleted).to.eql(true);
      expect(byId['doc-3']?.isDeleted).to.eql(false);
    });

    test('handles a result set larger than the SQL host-parameter limit by chunking the soft-delete', async () => {
      // Generate a fixture with more documents than fit in a single UPDATE ... WHERE id IN (...) chunk.
      const documentCount = 1200;
      const documents = Array.from({ length: documentCount }).map((_, i) => ({
        id: `doc-${i.toString().padStart(4, '0')}`,
        organizationId: 'organization-1',
        mimeType: 'text/plain',
        originalStorageKey: `s/${i}`,
        originalName: `doc-${i}.txt`,
        name: `doc ${i}`,
        originalSha256Hash: `h${i}`,
        isDeleted: false,
      }));

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents,
      });

      const documentsRepository = createDocumentsRepository({ db });
      const { services } = createStubSearchServices({ documentIds: documents.map((d) => d.id) });

      const { trashedDocumentIds, trashedCount } = await trashDocumentsBatch({
        filter: { query: 'irrelevant' },
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository,
        documentSearchServices: services,
        eventServices: createTestEventServices(),
      });

      expect(trashedCount).to.eql(documentCount);
      expect(trashedDocumentIds).to.have.length(documentCount);

      const records = await db.select().from(documentsTable);
      expect(records.every((r) => r.isDeleted === true)).to.eql(true);
    });
  });

  describe('tagDocumentsBatch', () => {
    const orgTags = [
      {
        id: 'tag-1',
        name: 'Tag One',
        normalizedName: 'tag one',
        color: '#000000',
        organizationId: 'organization-1',
      },
      {
        id: 'tag-2',
        name: 'Tag Two',
        normalizedName: 'tag two',
        color: '#111111',
        organizationId: 'organization-1',
      },
    ];

    test('adds the tag to every resolved document', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
        tags: orgTags,
      });

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      const { taggedCount, untaggedCount } = await tagDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        addTagIds: ['tag-1'],
        removeTagIds: [],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      expect(taggedCount).to.eql(2);
      expect(untaggedCount).to.eql(0);

      const pairs = await db.select().from(documentsTagsTable);
      expect(pairs.map((p) => `${p.documentId}:${p.tagId}`).toSorted()).to.eql([
        'doc-1:tag-1',
        'doc-2:tag-1',
      ]);
    });

    test('rejects the request if any documentId does not belong to the organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          {
            id: 'doc-foreign',
            organizationId: 'organization-2',
            mimeType: 'text/plain',
            originalStorageKey: 's',
            originalName: 'foreign',
            name: 'foreign',
            originalSha256Hash: 'hf',
          },
        ],
        tags: orgTags,
      });

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      await expect(
        tagDocumentsBatch({
          filter: { documentIds: ['doc-1', 'doc-foreign'] },
          addTagIds: ['tag-1'],
          removeTagIds: [],
          organizationId: 'organization-1',
          userId: 'user-1',
          documentsRepository: createDocumentsRepository({ db }),
          tagsRepository: createTagsRepository({ db }),
          documentSearchServices: searchServices,
          eventServices,
        }),
      ).rejects.toThrow(createDocumentIdsNotFromOrganizationError());

      const pairs = await db.select().from(documentsTagsTable);
      expect(pairs).to.eql([]);
    });

    test('skips pairs that already exist (idempotent re-apply)', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
        tags: orgTags,
      });
      await db.insert(documentsTagsTable).values([{ documentId: 'doc-1', tagId: 'tag-1' }]);

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      const { taggedCount } = await tagDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        addTagIds: ['tag-1'],
        removeTagIds: [],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      expect(taggedCount).to.eql(1);
      const pairs = await db.select().from(documentsTagsTable);
      expect(pairs.map((p) => `${p.documentId}:${p.tagId}`).toSorted()).to.eql([
        'doc-1:tag-1',
        'doc-2:tag-1',
      ]);

      // Only the newly-added pair is reported in the emitted event (idempotent skip of the existing one).
      const [event] = eventServices.getEmittedEvents();
      expect(event?.eventName).to.eql('document.tags.changed');
      expect(event?.payload.addedPairs).to.have.length(1);
    });

    test('removes only existing tag pairs', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
        tags: orgTags,
      });
      await db.insert(documentsTagsTable).values([
        { documentId: 'doc-1', tagId: 'tag-1' },
        { documentId: 'doc-2', tagId: 'tag-2' },
      ]);

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      const { taggedCount, untaggedCount } = await tagDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        addTagIds: [],
        removeTagIds: ['tag-1'],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      expect(taggedCount).to.eql(0);
      expect(untaggedCount).to.eql(1);

      const pairs = await db.select().from(documentsTagsTable);
      expect(pairs.map((p) => `${p.documentId}:${p.tagId}`).toSorted()).to.eql(['doc-2:tag-2']);
    });

    test('combined add and remove in one call', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
        tags: orgTags,
      });
      await db.insert(documentsTagsTable).values([{ documentId: 'doc-1', tagId: 'tag-1' }]);

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      const { taggedCount, untaggedCount } = await tagDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        addTagIds: ['tag-2'],
        removeTagIds: ['tag-1'],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      expect(taggedCount).to.eql(2);
      expect(untaggedCount).to.eql(1);

      const pairs = await db.select().from(documentsTagsTable);
      expect(pairs.map((p) => `${p.documentId}:${p.tagId}`).toSorted()).to.eql([
        'doc-1:tag-2',
        'doc-2:tag-2',
      ]);
    });

    test('throws TagNotFoundError when a tag id does not belong to the org', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
        documents: [{ id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' }],
        tags: [
          ...orgTags,
          {
            id: 'tag-other-org',
            name: 'Other',
            normalizedName: 'other',
            color: '#222222',
            organizationId: 'organization-2',
          },
        ],
      });

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      await expect(
        tagDocumentsBatch({
          filter: { documentIds: ['doc-1'] },
          addTagIds: ['tag-other-org'],
          removeTagIds: [],
          organizationId: 'organization-1',
          userId: 'user-1',
          documentsRepository: createDocumentsRepository({ db }),
          tagsRepository: createTagsRepository({ db }),
          documentSearchServices: searchServices,
          eventServices,
        }),
      ).rejects.toThrow();

      const pairs = await db.select().from(documentsTagsTable);
      expect(pairs).to.eql([]);
    });

    test('query-filter path delegates to the search service', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' }],
        tags: orgTags,
      });

      const { services: searchServices, calls: searchCalls } = createStubSearchServices({
        documentIds: ['doc-1'],
      });
      const eventServices = createTestEventServices();

      const { taggedCount } = await tagDocumentsBatch({
        filter: { query: 'tag:invoice' },
        addTagIds: ['tag-1'],
        removeTagIds: [],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      expect(taggedCount).to.eql(1);
      expect(searchCalls).to.eql([
        { organizationId: 'organization-1', searchQuery: 'tag:invoice' },
      ]);
    });

    test('emits a single document.tags.changed event carrying the actually-changed pairs', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
        tags: orgTags,
      });
      await db.insert(documentsTagsTable).values([{ documentId: 'doc-1', tagId: 'tag-2' }]);

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      await tagDocumentsBatch({
        filter: { documentIds: ['doc-1', 'doc-2'] },
        addTagIds: ['tag-1'],
        removeTagIds: ['tag-2'],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      const events = eventServices.getEmittedEvents();
      expect(events).to.have.length(1);

      const { eventName, payload } = events[0]!;
      expect(eventName).to.eql('document.tags.changed');
      expect(payload.organizationId).to.eql('organization-1');
      expect(payload.userId).to.eql('user-1');

      const addedPairs = payload.addedPairs as {
        documentId: string;
        tagId: string;
        tagName: string;
      }[];
      expect(addedPairs).to.have.length(2);
      expect(addedPairs.every((p) => p.tagId === 'tag-1' && p.tagName === 'Tag One')).to.eql(true);

      expect(payload.removedPairs).to.eql([
        { documentId: 'doc-1', tagId: 'tag-2', tagName: 'Tag Two' },
      ]);
    });

    test('does not emit any event when nothing changes', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' }],
        tags: orgTags,
      });
      await db.insert(documentsTagsTable).values([{ documentId: 'doc-1', tagId: 'tag-1' }]);

      const { services: searchServices } = createStubSearchServices();
      const eventServices = createTestEventServices();

      const { taggedCount, untaggedCount } = await tagDocumentsBatch({
        filter: { documentIds: ['doc-1'] },
        addTagIds: ['tag-1'],
        removeTagIds: ['tag-2'],
        organizationId: 'organization-1',
        userId: 'user-1',
        documentsRepository: createDocumentsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        documentSearchServices: searchServices,
        eventServices,
      });

      expect(taggedCount).to.eql(0);
      expect(untaggedCount).to.eql(0);
      expect(eventServices.getEmittedEvents()).to.eql([]);
    });
  });
});
