import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { documentsTable } from '../../documents.table';
import { createDocumentSearchRepository } from './database-fts5.repository';

describe('database-fts5 repository', () => {
  describe('searchOrganizationDocuments', () => {
    test('provides full text search on document name, original name, and content', async () => {
      const documents = [
        { id: 'doc-1', organizationId: 'organization-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc-2', organizationId: 'organization-1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc-3', organizationId: 'organization-1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await Promise.all(
        documents.map(async document => documentsSearchRepository.indexDocument({ document })),
      );

      const { documents: searchResults } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'lorem',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(searchResults).to.have.length(2);
      expect(searchResults.map(doc => doc.id)).to.eql(['doc-2', 'doc-1']);
    });
  });

  describe('indexDocument', () => {
    test('adds a document to the FTS index and makes it searchable', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Insert a document in the documents table (no automatic FTS indexing after migration)
      await db.insert(documentsTable).values({
        id: 'doc-1',
        organizationId: 'organization-1',
        name: 'New Document',
        originalName: 'new-doc.pdf',
        content: 'searchable content here',
        originalStorageKey: 'storage-key',
        mimeType: 'application/pdf',
        originalSha256Hash: 'hash1',
      }).execute();

      // Manually index the document to FTS
      await documentsSearchRepository.indexDocument({
        document: {
          id: 'doc-1',
          name: 'New Document',
          isDeleted: false,
          organizationId: 'organization-1',
          originalName: 'new-doc.pdf',
          content: 'searchable content here',
        },
      });

      // Verify document is searchable
      const { documents } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'searchable',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documents).to.have.length(1);
      expect(documents[0]?.id).to.equal('doc-1');
    });
  });

  describe('updateDocument', () => {
    test('updates document fields in the FTS index to reflect changes in search results', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Insert document and manually index it with original content
      await db.insert(documentsTable).values({
        id: 'doc-1',
        organizationId: 'organization-1',
        name: 'Original Name',
        originalName: 'original.pdf',
        content: 'original content',
        originalStorageKey: '',
        mimeType: 'application/pdf',
        originalSha256Hash: 'hash1',
      }).execute();

      await documentsSearchRepository.indexDocument({
        document: {
          id: 'doc-1',
          name: 'Original Name',
          originalName: 'original.pdf',
          content: 'original content',
          isDeleted: false,
          organizationId: 'organization-1',
        },
      });

      // Update the FTS index with new content
      await documentsSearchRepository.updateDocument({
        documentId: 'doc-1',
        document: {
          name: 'Updated Name',
          originalName: 'updated.pdf',
          content: 'updated content with new keywords',
        },
      });

      const resultsWithOldKeyword = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'original',
        pageIndex: 0,
        pageSize: 10,
      });

      const resultsWithNewKeyword = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'updated',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(resultsWithOldKeyword.documents).to.have.length(0);
      expect(resultsWithNewKeyword.documents).to.have.length(1);
      expect(resultsWithNewKeyword.documents[0]?.id).to.equal('doc-1');
    });
  });

  describe('deleteDocument', () => {
    test('removes a document from the FTS index and makes it unsearchable', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Insert documents and manually index them
      await db.insert(documentsTable).values([
        {
          id: 'doc-1',
          organizationId: 'organization-1',
          name: 'Document to Delete',
          originalName: 'delete-me.pdf',
          content: 'this will be deleted',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: 'hash1',
        },
        {
          id: 'doc-2',
          organizationId: 'organization-1',
          name: 'Document to Keep',
          originalName: 'keep-me.pdf',
          content: 'this will stay',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: 'hash2',
        },
      ]).execute();

      await documentsSearchRepository.indexDocument({
        document: {
          id: 'doc-1',
          name: 'Document to Delete',
          originalName: 'delete-me.pdf',
          content: 'this will be deleted',
          isDeleted: false,
          organizationId: 'organization-1',
        },
      });

      await documentsSearchRepository.indexDocument({
        document: {
          id: 'doc-2',
          name: 'Document to Keep',
          originalName: 'keep-me.pdf',
          content: 'this will stay',
          isDeleted: false,
          organizationId: 'organization-1',
        },
      });

      const beforeDelete = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'deleted',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(beforeDelete.documents).to.have.length(1);

      await documentsSearchRepository.deleteDocument({ documentId: 'doc-1' });

      const afterDelete = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'deleted',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(afterDelete.documents).to.have.length(0);
    });
  });
});
