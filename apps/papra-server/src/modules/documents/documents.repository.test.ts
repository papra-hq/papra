import { desc } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createDocumentAlreadyExistsError } from './documents.errors';
import { createDocumentsRepository } from './documents.repository';
import { documentsTable } from './documents.table';

describe('documents repository', () => {
  describe('crud operations on document collection', () => {
    test('a document can be created, retrieved, and soft deleted', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
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

      const documents = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));

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

      const documentsAfterDelete = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));

      expect(documentsAfterDelete).to.have.length(1);
      expect(documentsAfterDelete[0]!.isDeleted).toBe(true);
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

  describe('getDocumentById', () => {
    test('a retrieved document includes an empty propertyValues array when no custom properties exist', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1' },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const { document } = await documentsRepository.getDocumentById({ documentId: 'doc-1', organizationId: 'organization-1' });

      expect(document).toBeDefined();
      expect(document!.propertyValues).to.eql([]);
    });

    test('a retrieved document includes its custom property values', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1' },
        ],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'organization-1', name: 'Company', type: 'text', displayOrder: 0, isRequired: false },
          { id: 'cpd-2', organizationId: 'organization-1', name: 'Amount', type: 'number', displayOrder: 1, isRequired: false },
        ],
        documentCustomPropertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: 'Acme Corp', selectOptionId: null },
          { id: 'dcpv-2', documentId: 'doc-1', propertyDefinitionId: 'cpd-2', numberValue: 42, selectOptionId: null },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const { document } = await documentsRepository.getDocumentById({ documentId: 'doc-1', organizationId: 'organization-1' });

      expect(document).toBeDefined();
      expect(document!.propertyValues).to.have.length(2);
      expect(document!.propertyValues[0]).to.eql({ propertyDefinitionId: 'cpd-1', name: 'Company', value: 'Acme Corp' });
      expect(document!.propertyValues[1]).to.eql({ propertyDefinitionId: 'cpd-2', name: 'Amount', value: 42 });
    });

    test('a retrieved document includes multi-select property values grouped into arrays of option objects', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1' },
        ],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'organization-1', name: 'Categories', type: 'multi_select', displayOrder: 0, isRequired: false },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Finance', color: '#00FF00', displayOrder: 0 },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-1', value: 'Legal', color: '#FF0000', displayOrder: 1 },
        ],
        documentCustomPropertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', selectOptionId: 'cpso-1' },
          { id: 'dcpv-2', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', selectOptionId: 'cpso-2' },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const { document } = await documentsRepository.getDocumentById({ documentId: 'doc-1', organizationId: 'organization-1' });

      expect(document).toBeDefined();
      expect(document!.propertyValues).to.have.length(1);
      expect(document!.propertyValues[0]).to.eql({ propertyDefinitionId: 'cpd-1', name: 'Categories', value: [{ id: 'cpso-1', value: 'Finance', color: '#00FF00' }, { id: 'cpso-2', value: 'Legal', color: '#FF0000' }] });
    });

    test('property values from other documents are not included', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash1' },
          { id: 'doc-2', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 2', originalName: 'document-2.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash2' },
        ],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'organization-1', name: 'Company', type: 'text', displayOrder: 0, isRequired: false },
        ],
        documentCustomPropertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: 'Acme', selectOptionId: null },
          { id: 'dcpv-2', documentId: 'doc-2', propertyDefinitionId: 'cpd-1', textValue: 'Other Corp', selectOptionId: null },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const { document } = await documentsRepository.getDocumentById({ documentId: 'doc-1', organizationId: 'organization-1' });

      expect(document).toBeDefined();
      expect(document!.propertyValues).to.have.length(1);
      expect(document!.propertyValues[0]).to.eql({ propertyDefinitionId: 'cpd-1', name: 'Company', value: 'Acme' });
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
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { organizationId: 'organization-2', userId: 'user-2', role: ORGANIZATION_ROLES.OWNER },
        ],
        documents: [
          { id: 'doc-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 200, originalSha256Hash: 'hash1' },
          { id: 'doc-2', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 2', originalName: 'document-2.pdf', content: 'lorem', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 10, originalSha256Hash: 'hash2' },
          { id: 'doc-3', organizationId: 'organization-1', createdBy: 'user-1', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 5, originalSha256Hash: 'hash3' },
          { id: 'doc-4', organizationId: 'organization-2', createdBy: 'user-2', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 100, originalSha256Hash: 'hash4' },
          { id: 'doc-5', organizationId: 'organization-1', createdBy: 'user-2', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 100, originalSha256Hash: 'hash5', deletedAt: new Date(0), isDeleted: true },
          { id: 'doc-6', organizationId: 'organization-1', createdBy: 'user-2', name: 'File 3', originalName: 'document-3.pdf', content: 'ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSize: 100, originalSha256Hash: 'hash6', deletedAt: new Date(0), isDeleted: true },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const stats = await documentsRepository.getOrganizationStats({
        organizationId: 'organization-1',
      });

      expect(stats).to.deep.equal({
        documentsCount: 3,
        documentsSize: 215,
        totalDocumentsSize: 415,
        totalDocumentsCount: 5,
        deletedDocumentsCount: 2,
        deletedDocumentsSize: 200,
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
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const documentsRepository = createDocumentsRepository({ db });

      const stats = await documentsRepository.getOrganizationStats({
        organizationId: 'organization-1',
      });

      expect(stats).to.deep.equal({
        documentsCount: 0,
        documentsSize: 0,
        totalDocumentsSize: 0,
        totalDocumentsCount: 0,
        deletedDocumentsCount: 0,
        deletedDocumentsSize: 0,
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
        totalDocumentsSize: 0,
        totalDocumentsCount: 0,
        deletedDocumentsCount: 0,
        deletedDocumentsSize: 0,
      });
    });
  });
});
