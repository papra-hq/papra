import { map } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createDocumentAlreadyExistsError } from './documents.errors';
import { createDocumentsRepository } from './documents.repository';

describe('documents repository', () => {
  describe('crud operations on document collection', () => {
    test('a document can be created, retrieved, and soft deleted', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationUsers: [{ organizationId: 'organization-1', userId: 'user-1' }],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const { document } = await documentsRepository.saveOrganizationDocument({
        organizationId: 'organization-1',
        createdBy: 'user-1',
        mimeType: 'application/pdf',
        name: 'Document 1',
        originalName: 'document-1.pdf',
        originalStorageKey: 'document-1.pdf',
        originalSha256Hash: 'hash1',
      });

      expect(document).to.include({
        organizationId: 'organization-1',
        createdBy: 'user-1',
        mimeType: 'application/pdf',
        name: 'Document 1',
        originalName: 'document-1.pdf',
        originalStorageKey: 'document-1.pdf',
        originalSha256Hash: 'hash1',
        isDeleted: false,
      });

      const { documents } = await documentsRepository.getOrganizationDocuments({
        organizationId: 'organization-1',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documents).to.have.length(1);
      expect(documents[0]).to.include({
        organizationId: 'organization-1',
        createdBy: 'user-1',
        mimeType: 'application/pdf',
        name: 'Document 1',
        originalName: 'document-1.pdf',
        originalStorageKey: 'document-1.pdf',
        isDeleted: false,
      });

      await documentsRepository.softDeleteDocument({
        documentId: document.id,
        userId: 'user-1',
        organizationId: 'organization-1',
      });

      const { documents: documentsAfterDelete } = await documentsRepository.getOrganizationDocuments({
        organizationId: 'organization-1',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documentsAfterDelete).to.have.length(0);
    });
  });

  describe('saveOrganizationDocument', () => {
    test('a document is unique by organization, an error is raised if a document with the same hash already exists', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
      });

      const documentsRepository = createDocumentsRepository({ db });

      await documentsRepository.saveOrganizationDocument({
        organizationId: 'organization-1',
        createdBy: 'user-1',
        name: 'Document 1',
        originalName: 'document-1.pdf',
        content: 'lorem ipsum',
        originalStorageKey: '',
        mimeType: 'application/pdf',
        originalSha256Hash: 'hash1',
      });

      await expect(
        documentsRepository.saveOrganizationDocument({
          organizationId: 'organization-1',
          createdBy: 'user-1',
          name: 'Document 1',
          originalName: 'document-1.pdf',
          content: 'lorem ipsum',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: 'hash1',
        }),
      ).rejects.toThrow(createDocumentAlreadyExistsError());
    });
  });

  describe('searchOrganizationDocuments', () => {
    test('provides full text search on document name, original name, and content', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationUsers: [{ organizationId: 'organization-1', userId: 'user-1' }],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1' },
          { id: 'doc-2', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2' },
          { id: 'doc-3', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3' },
        ],
      });

      // Rebuild the FTS index since we are using an in-memory database
      await db.$client.execute(`INSERT INTO documents_fts(documents_fts) VALUES('rebuild');`);

      const documentsRepository = createDocumentsRepository({ db });

      const { documents } = await documentsRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'lorem',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documents).to.have.length(2);
      expect(map(documents, 'id')).to.eql(['doc-2', 'doc-1']);
    });
  });

  describe('getOrganizationStats', () => {
    test('retrieve document count and total size for an organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
        organizationUsers: [
          { organizationId: 'organization-1', userId: 'user-1' },
          { organizationId: 'organization-2', userId: 'user-2' },
        ],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 200, originalSha256Hash: 'hash1' },
          { id: 'doc-2', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 10, originalSha256Hash: 'hash2' },
          { id: 'doc-3', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 5, originalSha256Hash: 'hash3' },
          { id: 'doc-4', organizationId: 'organization-2', createdBy: 'user-2', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 100, originalSha256Hash: 'hash4' },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const stats = await documentsRepository.getOrganizationStats({
        organizationId: 'organization-1',
      });

      expect(stats).to.deep.equal({
        documentsCount: 3,
        documentsSize: 215,
      });
    });

    test('returns 0 count and size when no documents are present', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
        ],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
        ],
        organizationUsers: [
          { organizationId: 'organization-1', userId: 'user-1' },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const stats = await documentsRepository.getOrganizationStats({
        organizationId: 'organization-1',
      });

      expect(stats).to.deep.equal({
        documentsCount: 0,
        documentsSize: 0,
      });
    });

    test('returns 0 count and size when organization does not exist', async () => {
      const { db } = await createInMemoryDatabase();

      const documentsRepository = createDocumentsRepository({ db });

      const stats = await documentsRepository.getOrganizationStats({
        organizationId: 'organization-1',
      });

      expect(stats).to.deep.equal({
        documentsCount: 0,
        documentsSize: 0,
      });
    });
  });
});
