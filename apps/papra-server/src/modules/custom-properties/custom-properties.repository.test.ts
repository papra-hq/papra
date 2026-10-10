import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { CUSTOM_PROPERTY_TYPES } from './custom-properties.constants';
import { createCustomPropertyDefinitionAlreadyExistsError } from './custom-properties.errors';
import { createCustomPropertiesRepository } from './custom-properties.repository';

describe('custom-properties repository', () => {
  describe('property definitions', () => {
    test('can create and retrieve a property definition', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition: created } = await repository.createPropertyDefinition({
        definition: {
          organizationId: orgId,
          name: 'Invoice Number',
          type: CUSTOM_PROPERTY_TYPES.TEXT,
        },
      });

      expect(created).to.include({ name: 'Invoice Number', type: 'text', organizationId: orgId });

      const { propertyDefinitions } = await repository.getOrganizationPropertyDefinitions({
        organizationId: orgId,
      });
      expect(propertyDefinitions).to.have.length(1);
      expect(propertyDefinitions[0]).to.include({ name: 'Invoice Number' });
      expect(propertyDefinitions[0]?.options).to.eql([]);
    });

    test('can get a single property definition by ID', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition: created } = await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'Amount', type: CUSTOM_PROPERTY_TYPES.NUMBER },
      });

      const { definition } = await repository.getPropertyDefinitionById({
        propertyDefinitionId: created.id,
        organizationId: orgId,
      });
      expect(definition).to.include({ name: 'Amount', type: 'number' });
    });

    test('returns undefined for non-existent definition', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { definition } = await repository.getPropertyDefinitionById({
        propertyDefinitionId: 'cpd_nonexistent000000000000',
        organizationId: orgId,
      });
      expect(definition).to.eql(undefined);
    });

    test('can count property definitions', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'A', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });
      await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'B', type: CUSTOM_PROPERTY_TYPES.NUMBER },
      });

      const { count } = await repository.getOrganizationPropertyDefinitionsCount({
        organizationId: orgId,
      });
      expect(count).to.eql(2);
    });

    test('can update a property definition', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition: created } = await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'Old Name', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });

      const { propertyDefinition: updated } = await repository.updatePropertyDefinition({
        propertyDefinitionId: created.id,
        organizationId: orgId,
        name: 'New Name',
      });

      expect(updated).to.include({ name: 'New Name' });
    });

    test('can delete a property definition', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition: created } = await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'To Delete', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });

      await repository.deletePropertyDefinition({
        propertyDefinitionId: created.id,
        organizationId: orgId,
      });

      const { propertyDefinitions } = await repository.getOrganizationPropertyDefinitions({
        organizationId: orgId,
      });
      expect(propertyDefinitions).to.have.length(0);
    });

    test('throws on duplicate name within organization', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'Unique', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });

      await expect(
        repository.createPropertyDefinition({
          definition: { organizationId: orgId, name: 'Unique', type: CUSTOM_PROPERTY_TYPES.NUMBER },
        }),
      ).rejects.toThrow(createCustomPropertyDefinitionAlreadyExistsError());
    });
  });

  describe('document values', () => {
    test('inserts a value when the property is still absent', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });
      const { propertyDefinition } = await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'Vendor', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });

      const { applied } = await repository.setDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: propertyDefinition.id,
        expectedAbsent: true,
        values: [{ textValue: 'Acme Corp' }],
      });

      expect(applied).to.eql(true);

      const { values } = await repository.getDocumentCustomPropertyValues({ documentId: docId });
      expect(values).to.have.length(1);
      expect(values[0]!.value.textValue).to.eql('Acme Corp');
    });

    test('inserts multiple values atomically when the property is still absent', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });
      const { propertyDefinition } = await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'Tags', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });

      const { applied } = await repository.setDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: propertyDefinition.id,
        expectedAbsent: true,
        values: [{ textValue: 'alpha' }, { textValue: 'beta' }],
      });

      expect(applied).to.eql(true);

      const { values } = await repository.getDocumentCustomPropertyValues({ documentId: docId });
      expect(
        values.map((row) => row.value.textValue).sort((a, b) => (a ?? '').localeCompare(b ?? '')),
      ).to.eql(['alpha', 'beta']);
    });

    test('does not overwrite an existing value when expectedAbsent is set', async () => {
      const orgId = 'org_111111111111111111111111';
      const docId = 'doc_111111111111111111111111';

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: orgId, name: 'Test Org' }],
        documents: [
          {
            id: docId,
            organizationId: orgId,
            name: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            originalSha256Hash: 'abc',
            originalSize: 100,
            originalStorageKey: 'key',
          },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });
      const { propertyDefinition } = await repository.createPropertyDefinition({
        definition: { organizationId: orgId, name: 'Vendor', type: CUSTOM_PROPERTY_TYPES.TEXT },
      });

      await repository.setDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: propertyDefinition.id,
        values: [{ textValue: 'Existing vendor' }],
      });

      const { applied } = await repository.setDocumentCustomPropertyValue({
        documentId: docId,
        propertyDefinitionId: propertyDefinition.id,
        expectedAbsent: true,
        values: [{ textValue: 'Acme Corp' }],
      });

      expect(applied).to.eql(false);

      const { values } = await repository.getDocumentCustomPropertyValues({ documentId: docId });
      expect(values).to.have.length(1);
      expect(values[0]!.value.textValue).to.eql('Existing vendor');
    });
  });
});
