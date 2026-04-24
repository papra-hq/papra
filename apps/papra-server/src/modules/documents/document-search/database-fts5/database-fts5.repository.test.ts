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

      await documentsSearchRepository.indexDocuments({ documents });

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

      await documentsSearchRepository.indexDocuments({ documents });

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

    describe('documents count', () => {
      test('the total count of search results is returned for pagination', async () => {
        const documents = Array.from({ length: 15 }).map((_, index) => ({
          id: `doc_${index + 1}`,
          organizationId: 'org_1',
          name: `Document ${index + 1}`,
          originalName: `document-${index + 1}.pdf`,
          content: 'lorem ipsum dolor sit amet',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: `hash${index + 1}`,
          isDeleted: false,
        }));

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documentsCount, documents: searchDocuments } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'lorem',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(documentsCount).to.equal(15);
        expect(searchDocuments).to.have.length(10);
      });

      test('no results means total count is zero', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        const { documentsCount, documents: searchDocuments } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'nonexistent',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(documentsCount).to.equal(0);
        expect(searchDocuments).to.have.length(0);
      });

      test('document with multiple matching tags are not double-counted', async () => {
        const documents = [
          { id: 'doc_1', organizationId: 'org_1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
          { id: 'doc_2', organizationId: 'org_1', name: 'Document 2', originalName: 'document-2.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        ];

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          tags: [
            { id: 'tag_1', organizationId: 'org_1', name: 'tag1', normalizedName: 'tag1', color: '#ff0000' },
            { id: 'tag_2', organizationId: 'org_1', name: 'tag2', normalizedName: 'tag2', color: '#00ff00' },
          ],
          documentsTags: [
            { documentId: 'doc_1', tagId: 'tag_1' },
            { documentId: 'doc_1', tagId: 'tag_2' },
            { documentId: 'doc_2', tagId: 'tag_1' },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documentsCount, documents: searchDocuments } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'lorem',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(documentsCount).to.equal(2);
        expect(searchDocuments).to.have.length(2);
      });
    });

    describe('pagination', () => {
      test('pagination permits retrieving subsequent pages of results', async () => {
        const documents = Array.from({ length: 25 }).map((_, index) => ({
          id: `doc_${index + 1}`,
          organizationId: 'org_1',
          name: `Document ${index + 1}`,
          originalName: `document-${index + 1}.pdf`,
          content: 'lorem ipsum dolor sit amet',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: `hash${index + 1}`,
          isDeleted: false,
          createdAt: new Date(`2026-01-${String(index + 1).padStart(2, '0')}`),
        }));

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: firstPageDocuments, documentsCount: firstTotalCount } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'lorem',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(firstPageDocuments).to.have.length(10);
        expect(firstTotalCount).to.equal(25);
        expect(firstPageDocuments.map(doc => doc.id)).to.eql(['doc_25', 'doc_24', 'doc_23', 'doc_22', 'doc_21', 'doc_20', 'doc_19', 'doc_18', 'doc_17', 'doc_16']);

        const { documents: secondPageDocuments, documentsCount: secondTotalCount } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'lorem',
          pageIndex: 1,
          pageSize: 5,
        });

        expect(secondPageDocuments).to.have.length(5);
        expect(secondTotalCount).to.equal(25);
        expect(secondPageDocuments.map(doc => doc.id)).to.eql(['doc_20', 'doc_19', 'doc_18', 'doc_17', 'doc_16']);
      });

      test('with multiple tags per documents, the page size is respected', async () => {
        const documents = Array.from({ length: 20 }).map((_, index) => ({
          id: `doc_${index + 1}`,
          organizationId: 'org_1',
          name: `Document ${index + 1}`,
          originalName: `document-${index + 1}.pdf`,
          content: 'lorem ipsum dolor sit amet',
          originalStorageKey: '',
          mimeType: 'application/pdf',
          originalSha256Hash: `hash${index + 1}`,
          isDeleted: false,
        }));

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          tags: [
            { id: 'tag_1', organizationId: 'org_1', name: 'tag1', normalizedName: 'tag1', color: '#ff0000' },
            { id: 'tag_2', organizationId: 'org_1', name: 'tag2', normalizedName: 'tag2', color: '#00ff00' },
          ],
          documentsTags: [
            { documentId: 'doc_1', tagId: 'tag_1' },
            { documentId: 'doc_1', tagId: 'tag_2' },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });
        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: firstPageDocuments, documentsCount } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'lorem',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(firstPageDocuments).to.have.length(10);
        expect(documentsCount).to.equal(20);
      });
    });

    describe('search query can have filters', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Invoice cloudflare', originalName: 'document-1.pdf', content: 'Cloudflare invoice, hosting 5€', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false, createdAt: new Date('2026-01-10') },
        { id: 'doc_2', organizationId: 'org_1', name: 'Invoice smartphone', originalName: 'document-1.pdf', content: 'The smartphone invoice', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false, createdAt: new Date('2026-01-11') },
        { id: 'doc_3', organizationId: 'org_1', name: 'Car invoice', originalName: 'document-1.pdf', content: 'Your brand new car invoice, insurance attached', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false, createdAt: new Date('2026-01-12') },
        { id: 'doc_4', organizationId: 'org_1', name: 'Car insurance', originalName: 'document-2.pdf', content: 'Your car insurance contract', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash4', isDeleted: false, createdAt: new Date('2026-01-13') },
        { id: 'doc_5', organizationId: 'org_1', name: 'Meeting notes', originalName: 'document-3.pdf', content: 'Notes from the meeting about the new project', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash5', isDeleted: false, createdAt: new Date('2026-01-14') },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        tags: [
          { name: 'invoice', organizationId: 'org_1', id: 'tag_1', normalizedName: 'invoice', color: '#ff0000' },
          { name: 'car', organizationId: 'org_1', id: 'tag_2', normalizedName: 'car', color: '#00ff00' },
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

      await documentsSearchRepository.indexDocuments({ documents });

      const searches = [
        {
          searchQuery: '',
          expectedDocumentsIds: ['doc_1', 'doc_2', 'doc_3', 'doc_4', 'doc_5'],
        },
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
          searchQuery: 'tag:cAr tag:iNvoIce',
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
        {
          searchQuery: 'created:>=2026-01-12',
          expectedDocumentsIds: ['doc_3', 'doc_4', 'doc_5'],
        },
        {
          searchQuery: 'created:>=2026-01-12 created:<=2026-01-13',
          expectedDocumentsIds: ['doc_3', 'doc_4'],
        },
        {
          searchQuery: 'has:tags',
          expectedDocumentsIds: ['doc_1', 'doc_2', 'doc_3', 'doc_4'],
        },
        {
          searchQuery: '-has:tags',
          expectedDocumentsIds: ['doc_5'],
        },
        {
          searchQuery: 'NOT has:tags',
          expectedDocumentsIds: ['doc_5'],
        },
        {
          searchQuery: '-has:tags invoice',
          expectedDocumentsIds: [],
        },
        {
          searchQuery: 'has:tags created:>=2026-01-12',
          expectedDocumentsIds: ['doc_3', 'doc_4'],
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
      await documentsSearchRepository.indexDocuments({ documents });

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

    test('documents are ordered by creation date descending', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false, createdAt: new Date('2023-01-02T10:00:00Z') },
        { id: 'doc_2', organizationId: 'org_1', name: 'Document 2', originalName: 'document-2.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false, createdAt: new Date('2023-01-01T10:00:00Z') },
        { id: 'doc_3', organizationId: 'org_1', name: 'Document 3', originalName: 'document-3.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false, createdAt: new Date('2023-01-03T10:00:00Z') },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.indexDocuments({ documents });

      const { documents: searchResults } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'lorem',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(searchResults).to.have.length(3);
      expect(searchResults.map(doc => doc.id)).to.eql(['doc_3', 'doc_1', 'doc_2']);
    });
  });

  describe('indexDocuments', () => {
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
      await documentsSearchRepository.indexDocuments({
        documents: [{
          id: 'doc_1',
          name: 'New Document',
          isDeleted: false,
          organizationId: 'org_1',
          content: 'searchable content here',
        }],
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

    test('indexes multiple documents in a single call', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Alpha', originalName: 'alpha.pdf', content: 'alpha content', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Bravo', originalName: 'bravo.pdf', content: 'bravo content', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Charlie', originalName: 'charlie.pdf', content: 'charlie content', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.indexDocuments({ documents });

      const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'content',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(results.map(d => d.id).toSorted()).to.eql(['doc_1', 'doc_2', 'doc_3']);
    });

    test('is a no-op when called with an empty list', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.indexDocuments({ documents: [] });

      const { documentsCount } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: '',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documentsCount).to.equal(0);
    });
  });

  describe('updateDocuments', () => {
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

      await documentsSearchRepository.indexDocuments({
        documents: [{
          id: 'doc_1',
          name: 'Original Name',
          content: 'original content',
          isDeleted: false,
          organizationId: 'org_1',
        }],
      });

      // Update the FTS index with new content
      await documentsSearchRepository.updateDocuments({
        updates: [{
          documentId: 'doc_1',
          document: {
            name: 'Updated Name',
            content: 'updated content with new keywords',
          },
        }],
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

    test('applies heterogeneous per-row patches in a single call', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Alpha', originalName: 'alpha.pdf', content: 'alpha original', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Bravo', originalName: 'bravo.pdf', content: 'bravo original', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.indexDocuments({ documents });

      await documentsSearchRepository.updateDocuments({
        updates: [
          { documentId: 'doc_1', document: { name: 'Alpha Renamed' } },
          { documentId: 'doc_2', document: { content: 'bravo rewritten' } },
        ],
      });

      const { documents: renameMatches } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'Renamed',
        pageIndex: 0,
        pageSize: 10,
      });

      const { documents: rewriteMatches } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'rewritten',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(renameMatches.map(d => d.id)).to.eql(['doc_1']);
      expect(rewriteMatches.map(d => d.id)).to.eql(['doc_2']);
    });

    test('is a no-op when called with an empty list', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.updateDocuments({ updates: [] });
    });
  });

  describe('deleteDocuments', () => {
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

      await documentsSearchRepository.indexDocuments({
        documents: [
          {
            id: 'doc_1',
            name: 'Document to Delete',
            content: 'this will be deleted',
            isDeleted: false,
            organizationId: 'org_1',
          },
          {
            id: 'doc_2',
            name: 'Document to Keep',
            content: 'this will stay',
            isDeleted: false,
            organizationId: 'org_1',
          },
        ],
      });

      const beforeDelete = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'deleted',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(beforeDelete.documents).to.have.length(1);

      await documentsSearchRepository.deleteDocuments({ documentIds: ['doc_1'] });

      const afterDelete = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'deleted',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(afterDelete.documents).to.have.length(0);
    });

    test('removes multiple documents from the FTS index in a single call', async () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Alpha', originalName: 'alpha.pdf', content: 'shared keyword', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Bravo', originalName: 'bravo.pdf', content: 'shared keyword', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Charlie', originalName: 'charlie.pdf', content: 'shared keyword', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        documents,
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.indexDocuments({ documents });

      await documentsSearchRepository.deleteDocuments({ documentIds: ['doc_1', 'doc_3'] });

      const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'org_1',
        searchQuery: 'shared',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(results.map(d => d.id)).to.eql(['doc_2']);
    });

    test('is a no-op when called with an empty list', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      await documentsSearchRepository.deleteDocuments({ documentIds: [] });
    });
  });

  describe('custom property filters', () => {
    describe('boolean property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Laptop', originalName: 'laptop.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Phone', originalName: 'phone.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Desk', originalName: 'desk.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const setupDb = async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_1', organizationId: 'org_1', name: 'Warranty', key: 'warranty', type: 'boolean', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_1', booleanValue: true },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_1', booleanValue: false },
            // doc_3 has no warranty value set
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        return { documentsSearchRepository };
      };

      test('warranty:true returns only documents with warranty = true', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'warranty:true',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });

      test('warranty:false returns only documents with warranty = false', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'warranty:false',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_2']);
      });

      test('warranty:yes is accepted as truthy alias', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'warranty:yes',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });

      test('-warranty:true (NOT) returns documents without warranty = true', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: '-warranty:true',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id).toSorted()).to.eql(['doc_2', 'doc_3'].toSorted());
      });
    });

    describe('text property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'File A', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'File B', originalName: 'b.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'File C', originalName: 'c.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      test('category:invoice returns only documents where category text = "invoice"', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_2', organizationId: 'org_1', name: 'Category', key: 'category', type: 'text', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_2', textValue: 'invoice' },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_2', textValue: 'contract' },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'category:invoice',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });
    });

    describe('number property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Small', originalName: 's.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Medium', originalName: 'm.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Large', originalName: 'l.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const setupDb = async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_3', organizationId: 'org_1', name: 'Amount', key: 'amount', type: 'number', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_3', numberValue: 50 },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_3', numberValue: 150 },
            { id: 'dcpv_3', documentId: 'doc_3', propertyDefinitionId: 'cpd_3', numberValue: 300 },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        return { documentsSearchRepository };
      };

      test('amount:150 returns only the document with amount = 150', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'amount:150',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_2']);
      });

      test('amount:>100 returns documents with amount greater than 100', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'amount:>100',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id).toSorted()).to.eql(['doc_2', 'doc_3'].toSorted());
      });

      test('amount:>=150 amount:<=200 (AND) returns only doc_2', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'amount:>=150 amount:<=200',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_2']);
      });
    });

    describe('date property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Old', originalName: 'old.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Recent', originalName: 'recent.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Future', originalName: 'future.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      test('expiry:>2025-06-01 returns documents with expiry date after 2025-06-01', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_4', organizationId: 'org_1', name: 'Expiry', key: 'expiry', type: 'date', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_4', dateValue: new Date('2024-01-01') },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_4', dateValue: new Date('2025-07-01') },
            { id: 'dcpv_3', documentId: 'doc_3', propertyDefinitionId: 'cpd_4', dateValue: new Date('2026-01-01') },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'expiry:>2025-06-01',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id).toSorted()).to.eql(['doc_2', 'doc_3'].toSorted());
      });
    });

    describe('select property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Draft', originalName: 'd.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Approved', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Rejected', originalName: 'r.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      test('status:approved returns only documents whose select option key is "approved"', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_5', organizationId: 'org_1', name: 'Status', key: 'status', type: 'select', displayOrder: 0 },
          ],
          customPropertySelectOptions: [
            { id: 'cpso_1', propertyDefinitionId: 'cpd_5', name: 'Draft', key: 'draft', displayOrder: 0 },
            { id: 'cpso_2', propertyDefinitionId: 'cpd_5', name: 'Approved', key: 'approved', displayOrder: 1 },
            { id: 'cpso_3', propertyDefinitionId: 'cpd_5', name: 'Rejected', key: 'rejected', displayOrder: 2 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_5', selectOptionId: 'cpso_1' },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_5', selectOptionId: 'cpso_2' },
            { id: 'dcpv_3', documentId: 'doc_3', propertyDefinitionId: 'cpd_5', selectOptionId: 'cpso_3' },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'status:approved',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_2']);
      });
    });

    describe('multi_select property', () => {
      test('labels:urgent returns documents that have the "urgent" option among their multi-select values', async () => {
        const documents = [
          { id: 'doc_1', organizationId: 'org_1', name: 'File A', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
          { id: 'doc_2', organizationId: 'org_1', name: 'File B', originalName: 'b.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        ];

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_6', organizationId: 'org_1', name: 'Labels', key: 'labels', type: 'multi_select', displayOrder: 0 },
          ],
          customPropertySelectOptions: [
            { id: 'cpso_1', propertyDefinitionId: 'cpd_6', name: 'Urgent', key: 'urgent', displayOrder: 0 },
            { id: 'cpso_2', propertyDefinitionId: 'cpd_6', name: 'Low Priority', key: 'low-priority', displayOrder: 1 },
          ],
          documentCustomPropertyValues: [
            // doc_1 has both "urgent" and "low-priority"
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_6', selectOptionId: 'cpso_1' },
            { id: 'dcpv_2', documentId: 'doc_1', propertyDefinitionId: 'cpd_6', selectOptionId: 'cpso_2' },
            // doc_2 has only "low-priority"
            { id: 'dcpv_3', documentId: 'doc_2', propertyDefinitionId: 'cpd_6', selectOptionId: 'cpso_2' },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'labels:urgent',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });
    });

    describe('combined filters', () => {
      test('warranty:true AND category:invoice returns only documents matching both conditions', async () => {
        const documents = [
          { id: 'doc_1', organizationId: 'org_1', name: 'A', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
          { id: 'doc_2', organizationId: 'org_1', name: 'B', originalName: 'b.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
          { id: 'doc_3', organizationId: 'org_1', name: 'C', originalName: 'c.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
        ];

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_1', organizationId: 'org_1', name: 'Warranty', key: 'warranty', type: 'boolean', displayOrder: 0 },
            { id: 'cpd_2', organizationId: 'org_1', name: 'Category', key: 'category', type: 'text', displayOrder: 1 },
          ],
          documentCustomPropertyValues: [
            // doc_1: warranty=true, category=invoice → should match
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_1', booleanValue: true },
            { id: 'dcpv_2', documentId: 'doc_1', propertyDefinitionId: 'cpd_2', textValue: 'invoice' },
            // doc_2: warranty=true, category=contract → should not match
            { id: 'dcpv_3', documentId: 'doc_2', propertyDefinitionId: 'cpd_1', booleanValue: true },
            { id: 'dcpv_4', documentId: 'doc_2', propertyDefinitionId: 'cpd_2', textValue: 'contract' },
            // doc_3: warranty=false, category=invoice → should not match
            { id: 'dcpv_5', documentId: 'doc_3', propertyDefinitionId: 'cpd_1', booleanValue: false },
            { id: 'dcpv_6', documentId: 'doc_3', propertyDefinitionId: 'cpd_2', textValue: 'invoice' },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'warranty:true AND category:invoice',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });
    });

    describe('unknown custom property key', () => {
      test('a filter for an unknown key returns no results without crashing', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents: [
            { id: 'doc_1', organizationId: 'org_1', name: 'File', originalName: 'f.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({
          documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'File', content: '', isDeleted: false }],
        });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'unknownprop:foo',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results).to.have.length(0);
      });
    });

    describe('organization isolation', () => {
      test('a custom property key from org_2 does not match documents in org_1', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [
            { id: 'org_1', name: 'Organization 1' },
            { id: 'org_2', name: 'Organization 2' },
          ],
          documents: [
            { id: 'doc_1', organizationId: 'org_1', name: 'Org1 File', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
            { id: 'doc_2', organizationId: 'org_2', name: 'Org2 File', originalName: 'b.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
          ],
          customPropertyDefinitions: [
            // Same key "warranty" exists in both orgs
            { id: 'cpd_org1', organizationId: 'org_1', name: 'Warranty', key: 'warranty', type: 'boolean', displayOrder: 0 },
            { id: 'cpd_org2', organizationId: 'org_2', name: 'Warranty', key: 'warranty', type: 'boolean', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_org1', booleanValue: true },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_org2', booleanValue: true },
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({
          documents: [
            { id: 'doc_1', organizationId: 'org_1', name: 'Org1 File', content: '', isDeleted: false },
            { id: 'doc_2', organizationId: 'org_2', name: 'Org2 File', content: '', isDeleted: false },
          ],
        });

        const { documents: org1Results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'warranty:true',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(org1Results.map(d => d.id)).to.eql(['doc_1']);
      });
    });

    describe('user_relation property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'File A', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'File B', originalName: 'b.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'File C', originalName: 'c.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const setupDb = async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          users: [
            { id: 'usr_1', email: 'alice@example.com' },
            { id: 'usr_2', email: 'bob@example.com' },
          ],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_7', organizationId: 'org_1', name: 'Assignee', key: 'assignee', type: 'user_relation', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_7', userId: 'usr_1' },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_7', userId: 'usr_2' },
            // doc_3 has no assignee
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        return { documentsSearchRepository };
      };

      test('assignee:usr_1 returns only documents assigned to user with that id', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'assignee:usr_1',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });

      test('assignee:alice@example.com returns the document assigned to that email', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'assignee:alice@example.com',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });

      test('-assignee:usr_1 (NOT) returns documents not assigned to that user', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: '-assignee:usr_1',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id).toSorted()).to.eql(['doc_2', 'doc_3'].toSorted());
      });
    });

    describe('document_relation property', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'Contract', originalName: 'contract.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Amendment', originalName: 'amendment.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'Standalone', originalName: 'standalone.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      test('related:doc_1 returns only documents whose relation points to doc_1', async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_8', organizationId: 'org_1', name: 'Related Document', key: 'related', type: 'document_relation', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_2', propertyDefinitionId: 'cpd_8', relatedDocumentId: 'doc_1' },
            // doc_3 has no relation
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'related:doc_1',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_2']);
      });
    });

    describe('has: filter for custom properties', () => {
      const documents = [
        { id: 'doc_1', organizationId: 'org_1', name: 'With warranty', originalName: 'a.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1', isDeleted: false },
        { id: 'doc_2', organizationId: 'org_1', name: 'Also with warranty', originalName: 'b.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2', isDeleted: false },
        { id: 'doc_3', organizationId: 'org_1', name: 'No warranty', originalName: 'c.pdf', content: '', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3', isDeleted: false },
      ];

      const setupDb = async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_1', name: 'Organization 1' }],
          documents,
          customPropertyDefinitions: [
            { id: 'cpd_1', organizationId: 'org_1', name: 'Warranty', key: 'warranty', type: 'boolean', displayOrder: 0 },
          ],
          documentCustomPropertyValues: [
            { id: 'dcpv_1', documentId: 'doc_1', propertyDefinitionId: 'cpd_1', booleanValue: true },
            { id: 'dcpv_2', documentId: 'doc_2', propertyDefinitionId: 'cpd_1', booleanValue: false },
            // doc_3 has no warranty value at all
          ],
        });

        const documentsSearchRepository = createDocumentSearchRepository({ db });

        await documentsSearchRepository.indexDocuments({ documents });

        return { documentsSearchRepository };
      };

      test('has:warranty returns all documents that have any value set for the property', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'has:warranty',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id).toSorted()).to.eql(['doc_1', 'doc_2'].toSorted());
      });

      test('-has:warranty returns only documents with no value set for the property', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: '-has:warranty',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_3']);
      });

      test('has:warranty combined with a value filter narrows results correctly', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'has:warranty warranty:true',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results.map(d => d.id)).to.eql(['doc_1']);
      });

      test('has:unknownprop returns no results without crashing', async () => {
        const { documentsSearchRepository } = await setupDb();

        const { documents: results } = await documentsSearchRepository.searchOrganizationDocuments({
          organizationId: 'org_1',
          searchQuery: 'has:unknownprop',
          pageIndex: 0,
          pageSize: 10,
        });

        expect(results).to.have.length(0);
      });
    });
  });
});
