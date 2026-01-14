import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { documentsTable } from '../../documents.table';
import { createDocumentSearchRepository } from './database-fts5.repository';

describe('database-fts5 repository', () => {
  describe('searchOrganizationDocuments', () => {
    test('provides full text search on document name, original name, and content', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await Promise.all(
        documents.map(async document => documentsSearchRepository.indexDocument({ document })),
      );

      const { documents: searchResults } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'lorem',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(searchResults).to.have.length(2);
      expect(searchResults.map(doc => doc.id).toSorted()).to.eql(['doc_1', 'doc_2']);
    });

    test('search query can have special characters', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'c\'est énorme', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await Promise.all(
        documents.map(async document => documentsSearchRepository.indexDocument({ document })),
      );

      const { documents: searchResults1 } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'énorme',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(searchResults1).to.have.length(1);
      expect(searchResults1.map(doc => doc.id)).to.eql(['doc_1']);

      const { documents: searchResults2 } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'c\'est',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(searchResults2).to.have.length(1);
      expect(searchResults2.map(doc => doc.id)).to.eql(['doc_1']);
    });

    describe('search query can have filters', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Invoice cloudflare', originalName: 'document-1.pdf', content: 'Cloudflare invoice, hosting 5€', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Invoice smartphone', originalName: 'document-1.pdf', content: 'The smartphone invoice', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Car invoice', originalName: 'document-1.pdf', content: 'Your brand new car invoice, insurance attached', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
        { id: 'doc_4', organizationId: 'org_1', name: 'Car insurance', originalName: 'document-2.pdf', content: 'Your car insurance contract', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash4', isDeleted: false },
        { id: 'doc_5', organizationId: 'org_1', name: 'Meeting notes', originalName: 'document-3.pdf', content: 'Notes from the meeting about the new project', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash5', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        tags: [
          { name: 'invoice', organizationId: 'org_1', id: 'tag_1', color: '#ff0000' },
          { name: 'car', organizationId: 'org_1', id: 'tag_2', color: '#00ff00' },
        ],
        documents,
        documentsTags: [
          { documentId: 'doc_1', tagId: 'tag_1' },
          { documentId: 'doc_2', tagId: 'tag_1' },
          { documentId: 'doc_3', tagId: 'tag_1' },
          { documentId: 'doc_3', tagId: 'tag_2' },
          { documentId: 'doc_4', tagId: 'tag_2' },
        ],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await Promise.all(
        documents.map(async document => documentsSearchRepository.indexDocument({ document })),
      );

      const searches = [
        {
          searchQuery: 'invoice',
          expectedDocumentsIds: ['doc_1', 'doc_2', 'doc_3'],
        },
        {
          searchQuery: 'invoice cloudflare',
          expectedDocumentsIds: ['doc_1'],
        },
        {
          searchQuery: 'tag:invoice',
          expectedDocumentsIds: ['doc_1', 'doc_2', 'doc_3'],
        },
        {
          searchQuery: 'tag:car tag:invoice',
          expectedDocumentsIds: ['doc_3'],
        },
        {
          searchQuery: 'tag:car NOT contract',
          expectedDocumentsIds: ['doc_3'],
        },
        {
          searchQuery: 'name:insurance',
          expectedDocumentsIds: ['doc_4'],
        },
        {
          searchQuery: 'name:invoice tag:invoice smartphone',
          expectedDocumentsIds: ['doc_2'],
        },
      ];

      for (const { searchQuery, expectedDocumentsIds } of searches) {
        test(`search query: "${searchQuery}"`, async () => {
          const { documents } = await documentsSearchRepository.searchOrganizationDocuments({
            organizationId: 'org_1',
            searchQuery,
            pageIndex: 0,
            pageSize: 10,
          });

          expect(documents.map(doc => doc.id).toSorted()).to.eql(expectedDocumentsIds.toSorted());
        });
      }
    });

    test('enforces organization isolation to prevent searching documents from other organizations', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Organization 1 Secret Document', originalName: 'secret-org1.pdf', content: 'confidential data for org 1', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Public Information', originalName: 'public.pdf', content: 'public data', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_2', name: 'Organization 2 Secret Document', originalName: 'secret-org2.pdf', content: 'confidential data for org 2', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
        { id: 'doc_4', organizationId: 'org_2', name: 'Another Confidential File', originalName: 'confidential.pdf', content: 'more confidential information', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash4', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Organization 1' },
          { id: 'org_2', name: 'Organization 2' },
        ],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Index all documents from both organizations
      await Promise.all(
        documents.map(async document => documentsSearchRepository.indexDocument({ document })),
      );

      // Search in org_1 with a term that exists in both organizations
      const { documents: org1Results } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'confidential',
        pageIndex: 0,
        pageSize: 10,
      });

      // Should only return documents from org_1, not org_2
      expect(org1Results).to.have.length(1);
      expect(org1Results.map(doc => doc.id)).to.eql(['doc_1']);
      expect(org1Results.every(doc => doc.organizationId === 'org_1')).to.eql(true);

      // Search in org_2 with the same term
      const { documents: org2Results } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_2',
        searchQuery: 'confidential',
        pageIndex: 0,
        pageSize: 10,
      });

      // Should only return documents from org_2, not org_1
      expect(org2Results).to.have.length(2);
      expect(org2Results.map(doc => doc.id).toSorted()).to.eql(['doc_3', 'doc_4']);
      expect(org2Results.every(doc => doc.organizationId === 'org_2')).to.eql(true);

      // Search for organization-specific content should not leak across organizations
      const { documents: org1SpecificSearch } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'Organization 2',
        pageIndex: 0,
        pageSize: 10,
      });

      // Even though "Organization 2" appears in org_2's documents, org_1 search should return nothing
      expect(org1SpecificSearch).to.have.length(0);
    });
  });

  describe('indexDocument', () => {
    test('adds a document to the FTS index and makes it searchable', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Insert a document in the documents table (no automatic FTS indexing after migration)
      await db.insert(documentsTable).values({
        id: 'doc_1',
        organizationId: 'org_1',
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
          id: 'doc_1',
          name: 'New Document',
          isDeleted: false,
          organizationId: 'org_1',
          originalName: 'new-doc.pdf',
          content: 'searchable content here',
        },
      });

      // Verify document is searchable
      const { documents } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'searchable',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documents).to.have.length(1);
      expect(documents[0]?.id).to.equal('doc_1');
    });
  });

  describe('updateDocument', () => {
    test('updates document fields in the FTS index to reflect changes in search results', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Insert document and manually index it with original content
      await db.insert(documentsTable).values({
        id: 'doc_1',
        organizationId: 'org_1',
        name: 'Original Name',
        originalName: 'original.pdf',
        content: 'original content',
        originalStorageKey: '',
        mimeType: 'application/pdf',
        originalSha256Hash: 'hash1',
      }).execute();

      await documentsSearchRepository.indexDocument({
        document: {
          id: 'doc_1',
          name: 'Original Name',
          originalName: 'original.pdf',
          content: 'original content',
          isDeleted: false,
          organizationId: 'org_1',
        },
      });

      // Update the FTS index with new content
      await documentsSearchRepository.updateDocument({
        documentId: 'doc_1',
        document: {
          name: 'Updated Name',
          originalName: 'updated.pdf',
          content: 'updated content with new keywords',
        },
      });

      const resultsWithOldKeyword = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'original',
        pageIndex: 0,
        pageSize: 10,
      });

      const resultsWithNewKeyword = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'updated',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(resultsWithOldKeyword.documents).to.have.length(0);
      expect(resultsWithNewKeyword.documents).to.have.length(1);
      expect(resultsWithNewKeyword.documents[0]?.id).to.equal('doc_1');
    });
  });

  describe('deleteDocument', () => {
    test('removes a document from the FTS index and makes it unsearchable', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      // Insert documents and manually index them
      await db.insert(documentsTable).values([
        {
          id: 'doc_1',
          organizationId: 'org_1',
          name: 'Document to Delete',
          originalName: 'delete-me.pdf',
          content: 'this will be deleted',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: 'hash1',
        },
        {
          id: 'doc_2',
          organizationId: 'org_1',
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
          id: 'doc_1',
          name: 'Document to Delete',
          originalName: 'delete-me.pdf',
          content: 'this will be deleted',
          isDeleted: false,
          organizationId: 'org_1',
        },
      });

      await documentsSearchRepository.indexDocument({
        document: {
          id: 'doc_2',
          name: 'Document to Keep',
          originalName: 'keep-me.pdf',
          content: 'this will stay',
          isDeleted: false,
          organizationId: 'org_1',
        },
      });

      const beforeDelete = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'deleted',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(beforeDelete.documents).to.have.length(1);

      await documentsSearchRepository.deleteDocument({ documentId: 'doc_1' });

      const afterDelete = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'deleted',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(afterDelete.documents).to.have.length(0);
    });
  });
});
