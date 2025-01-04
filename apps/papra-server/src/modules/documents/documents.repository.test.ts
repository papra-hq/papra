import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
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
        storageKey: 'document-1.pdf',
      });

      expect(document).to.include({
        organizationId: 'organization-1',
        createdBy: 'user-1',
        mimeType: 'application/pdf',
        name: 'Document 1',
        originalName: 'document-1.pdf',
        storageKey: 'document-1.pdf',
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
        storageKey: 'document-1.pdf',
        isDeleted: false,
      });

      await documentsRepository.softDeleteDocument({
        documentId: document.id,
        userId: 'user-1',
      });

      const { documents: documentsAfterDelete } = await documentsRepository.getOrganizationDocuments({
        organizationId: 'organization-1',
        pageIndex: 0,
        pageSize: 10,
      });

      expect(documentsAfterDelete).to.have.length(0);
    });
  });
});
