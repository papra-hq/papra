import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { CUSTOM_PROPERTY_TYPES } from './custom-properties.constants';
import { createCustomPropertiesRepository } from './custom-properties.repository';
import { createPropertyDefinition, deleteDocumentCustomPropertyValue, deletePropertyDefinition, ensurePropertyDefinitionExists, setDocumentCustomPropertyValue, updatePropertyDefinition } from './custom-properties.usecases';
import { createCustomPropertiesOptionsRepository } from './options/custom-properties-options.repository';

describe('custom-properties usecases', () => {
  describe('createPropertyDefinition', () => {
    test('creates a property definition successfully', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      const { propertyDefinition: definition } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'Invoice Number', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      expect(definition).to.include({ name: 'Invoice Number', type: 'text' });
    });

    test('enforces organization limit', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      const config = overrideConfig({
        customProperties: {
          maxCustomPropertiesPerOrganization: 2,
        },
      });

      await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'A', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });
      await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'B', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      await expect(
        createPropertyDefinition({
          organizationId: orgId,
          definition: { name: 'C', type: CUSTOM_PROPERTY_TYPES.TEXT },
          config,
          customPropertiesRepository,
          customPropertiesOptionsRepository,
        }),
      ).rejects.toThrow('The maximum number of custom properties for this organization has been reached.');
    });
  });

  describe('updatePropertyDefinition', () => {
    test('updates a property definition', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      const { propertyDefinition: created } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'Old', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      const { propertyDefinition: updated } = await updatePropertyDefinition({
        propertyDefinitionId: created.id,
        organizationId: orgId,
        rawDefinition: { name: 'New' },
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      expect(updated).to.include({ name: 'New' });
    });

    test('throws when definition does not exist', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await expect(
        updatePropertyDefinition({
          propertyDefinitionId: 'cpd_nonexistent000000000000',
          organizationId: orgId,
          rawDefinition: { name: 'New' },
          customPropertiesRepository,
          customPropertiesOptionsRepository,
        }),
      ).rejects.toThrow('Custom property definition not found.');
    });
  });

  describe('deletePropertyDefinition', () => {
    test('deletes a property definition', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      const { propertyDefinition: created } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'To Delete', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      await deletePropertyDefinition({
        propertyDefinitionId: created.id,
        organizationId: orgId,
        customPropertiesRepository,
      });

      await expect(
        ensurePropertyDefinitionExists({
          propertyDefinitionId: created.id,
          organizationId: orgId,
          customPropertiesRepository,
        }),
      ).rejects.toThrow('Custom property definition not found.');
    });
  });

  describe('setDocumentCustomPropertyValue', () => {
    test('sets a text value on a document', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { propertyDefinition: definition } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'Note', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      await setDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: definition.id,
        organizationId: orgId,
        value: 'Hello',
        customPropertiesRepository,
        customPropertiesOptionsRepository,
        organizationsRepository,
        documentsRepository,
      });

      const { values } = await customPropertiesRepository.getDocumentCustomPropertyValues({ documentId: docId });
      expect(values).to.have.length(1);
      expect(values[0]!.value.textValue).to.eql('Hello');
    });

    test('rejects invalid select option ID', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { propertyDefinition: definition } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'Category', type: CUSTOM_PROPERTY_TYPES.SELECT, options: [] },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      await expect(
        setDocumentCustomPropertyValue({
          documentId: docId,
          propertyDefinitionId: definition.id,
          organizationId: orgId,
          value: 'cpso_aaaaaaaaaaaaaaaaaaaaaaaa',
          customPropertiesRepository,
          customPropertiesOptionsRepository,
          organizationsRepository,
          documentsRepository,
        }),
      ).rejects.toThrow('The provided value is not a valid option for this select property.');
    });

    test('rejects invalid value type', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { propertyDefinition: definition } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'Amount', type: CUSTOM_PROPERTY_TYPES.NUMBER },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      await expect(
        setDocumentCustomPropertyValue({
          documentId: docId,
          propertyDefinitionId: definition.id,
          organizationId: orgId,
          value: 'not-a-number',
          customPropertiesRepository,
          customPropertiesOptionsRepository,
          organizationsRepository,
          documentsRepository,
        }),
      ).rejects.toThrow('The provided value is invalid for this property type.');
    });
  });

  describe('deleteDocumentCustomPropertyValue', () => {
    test('removes a value from a document', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [{ id: docId, organizationId: orgId, name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalSha256Hash: 'abc', originalSize: 100, originalStorageKey: 'key' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { propertyDefinition: definition } = await createPropertyDefinition({
        organizationId: orgId,
        definition: { name: 'Note', type: CUSTOM_PROPERTY_TYPES.TEXT },
        config: overrideConfig(),
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      await setDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: definition.id,
        organizationId: orgId,
        value: 'Hello',
        customPropertiesRepository,
        customPropertiesOptionsRepository,
        organizationsRepository,
        documentsRepository,
      });

      await deleteDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: definition.id,
        organizationId: orgId,
        customPropertiesRepository,
      });

      const { values } = await customPropertiesRepository.getDocumentCustomPropertyValues({ documentId: docId });
      expect(values).to.have.length(0);
    });
  });
});
