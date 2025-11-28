import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../../../organizations/organizations.constants';
import { createDocumentSearchRepository } from './database-fts5.repository';

describe('database-fts5 repository', () => {
  describe('searchOrganizationDocuments', () => {
    test('provides full text search on document name, original name, and content', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1' },
          { id: 'doc-2', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2' },
          { id: 'doc-3', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash3' },
        ],
      });

      // Rebuild the FTS index since we are using an in-memory database
      await db.$client.execute(`INSERT INTO documents_fts(documents_fts) VALUES('rebuild');`);

      const documentsSearchRepository = createDocumentSearchRepository({ db });

      const { documents } = await documentsSearchRepository.searchOrganizationDocuments({
        organizationId: 'organization-1',
        searchQuery: 'lorem',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documents).to.have.length(2);
      expect(documents.map(doc => doc.id)).to.eql(['doc-2', 'doc-1']);
    });
  });
});
