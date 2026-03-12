import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createCustomPropertyDefinitionAlreadyExistsError } from './custom-properties.errors';
import { createCustomPropertiesRepository } from './custom-properties.repository';

describe('custom-properties repository', () => {
  describe('createPropertyDefinition', () => {
    test('a text property definition can be created for an organization', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await repository.createPropertyDefinition({
        definition: {
          organizationId: 'org-1',
          name: 'Company Name',
          type: 'text',
          description: 'The name of the company',
        },
      });

      expect(propertyDefinition).to.include({
        organizationId: 'org-1',
        name: 'Company Name',
        type: 'text',
        description: 'The name of the company',
        isRequired: false,
        displayOrder: 0,
      });
      expect(propertyDefinition.id).to.match(/^cpd_/);
    });

    test('creating a property definition with a duplicate name in the same organization throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await expect(
        repository.createPropertyDefinition({
          definition: {
            organizationId: 'org-1',
            name: 'Company Name',
            type: 'text',
          },
        }),
      ).rejects.toThrow(createCustomPropertyDefinitionAlreadyExistsError());
    });

    test('properties with the same name can exist in different organizations', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org-1', name: 'Organization 1' },
          { id: 'org-2', name: 'Organization 2' },
        ],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await repository.createPropertyDefinition({
        definition: {
          organizationId: 'org-2',
          name: 'Company Name',
          type: 'text',
        },
      });

      expect(propertyDefinition.organizationId).to.eql('org-2');
      expect(propertyDefinition.name).to.eql('Company Name');
    });
  });

  describe('getOrganizationPropertyDefinitions', () => {
    test('all property definitions for an organization are returned with their options', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text', displayOrder: 0 },
          { id: 'cpd-2', organizationId: 'org-1', name: 'Status', type: 'select', displayOrder: 1 },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-2', value: 'Active', displayOrder: 0 },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-2', value: 'Archived', displayOrder: 1 },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinitions } = await repository.getOrganizationPropertyDefinitions({ organizationId: 'org-1' });

      expect(propertyDefinitions).to.have.length(2);
      expect(propertyDefinitions[0]?.name).to.eql('Company Name');
      expect(propertyDefinitions[0]?.options).to.have.length(0);
      expect(propertyDefinitions[1]?.name).to.eql('Status');
      expect(propertyDefinitions[1]?.options).to.have.length(2);
      expect(propertyDefinitions[1]?.options[0]?.value).to.eql('Active');
    });

    test('property definitions from other organizations are not returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org-1', name: 'Organization 1' },
          { id: 'org-2', name: 'Organization 2' },
        ],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
          { id: 'cpd-2', organizationId: 'org-2', name: 'Other Property', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinitions } = await repository.getOrganizationPropertyDefinitions({ organizationId: 'org-1' });

      expect(propertyDefinitions).to.have.length(1);
      expect(propertyDefinitions[0]?.name).to.eql('Company Name');
    });
  });

  describe('getOrganizationPropertyDefinitionsCount', () => {
    test('the count of property definitions for an organization is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Prop 1', type: 'text' },
          { id: 'cpd-2', organizationId: 'org-1', name: 'Prop 2', type: 'number' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { count } = await repository.getOrganizationPropertyDefinitionsCount({ organizationId: 'org-1' });

      expect(count).to.eql(2);
    });
  });

  describe('getPropertyDefinitionById', () => {
    test('a property definition is returned by id with its options', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', displayOrder: 0 },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await repository.getPropertyDefinitionById({
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
      });

      expect(propertyDefinition?.name).to.eql('Status');
      expect(propertyDefinition?.options).to.have.length(1);
    });

    test('undefined is returned when the property definition does not exist', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await repository.getPropertyDefinitionById({
        propertyDefinitionId: 'cpd-nonexistent',
        organizationId: 'org-1',
      });

      expect(propertyDefinition).to.eql(undefined);
    });
  });

  describe('updatePropertyDefinition', () => {
    test('a property definition name can be updated', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Old Name', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await repository.updatePropertyDefinition({
        propertyDefinitionId: 'cpd-1',
        name: 'New Name',
      });

      expect(propertyDefinition.name).to.eql('New Name');
    });
  });

  describe('deletePropertyDefinition', () => {
    test('a property definition can be deleted', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.deletePropertyDefinition({ propertyDefinitionId: 'cpd-1' });

      const { propertyDefinitions } = await repository.getOrganizationPropertyDefinitions({ organizationId: 'org-1' });
      expect(propertyDefinitions).to.have.length(0);
    });
  });

  describe('document property values', () => {
    test('a text value can be set on a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyValue } = await repository.setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        textValue: 'Acme Corp',
      });

      expect(propertyValue?.textValue).to.eql('Acme Corp');
      expect(propertyValue?.documentId).to.eql('doc-1');
      expect(propertyValue?.propertyDefinitionId).to.eql('cpd-1');
    });

    test('setting a value replaces the existing value for the same property', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        textValue: 'Old Value',
      });

      await repository.setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        textValue: 'New Value',
      });

      const { propertyValues } = await repository.getDocumentPropertyValues({
        documentId: 'doc-1',
        organizationId: 'org-1',
      });

      expect(propertyValues).to.have.length(1);
      expect(propertyValues[0]?.textValue).to.eql('New Value');
    });

    test('multi-select values can be set as multiple rows using option IDs', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Categories', type: 'multi_select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Finance', displayOrder: 0 },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-1', value: 'Legal', displayOrder: 1 },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { propertyValues } = await repository.setDocumentMultiSelectPropertyValues({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        selectOptionIds: ['cpso-1', 'cpso-2'],
      });

      expect(propertyValues).to.have.length(2);
      expect(propertyValues.map(v => v.selectOptionId)).to.include.members(['cpso-1', 'cpso-2']);
    });

    test('a property value can be deleted from a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
        documentCustomPropertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: 'Acme Corp', selectOptionId: null },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.deleteDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
      });

      const { propertyValues } = await repository.getDocumentPropertyValues({
        documentId: 'doc-1',
        organizationId: 'org-1',
      });

      expect(propertyValues).to.have.length(0);
    });

    test('deleting a property definition cascades to its values', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
        documentCustomPropertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: 'Acme Corp', selectOptionId: null },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.deletePropertyDefinition({ propertyDefinitionId: 'cpd-1' });

      const { propertyValues } = await repository.getDocumentPropertyValues({
        documentId: 'doc-1',
        organizationId: 'org-1',
      });

      expect(propertyValues).to.have.length(0);
    });
  });

  describe('select options', () => {
    test('select options can be created for a property definition', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { options } = await repository.createSelectOptions({
        options: [
          { propertyDefinitionId: 'cpd-1', value: 'Active', color: '#00FF00', displayOrder: 0 },
          { propertyDefinitionId: 'cpd-1', value: 'Archived', color: '#FF0000', displayOrder: 1 },
        ],
      });

      expect(options).to.have.length(2);
      expect(options[0]?.value).to.eql('Active');
      expect(options[1]?.value).to.eql('Archived');
    });

    test('select options can be retrieved by definition id', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', displayOrder: 0 },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-1', value: 'Archived', displayOrder: 1 },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      const { options } = await repository.getSelectOptionsByDefinitionId({ propertyDefinitionId: 'cpd-1' });

      expect(options).to.have.length(2);
    });

    test('deleting a property definition cascades to its select options', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', displayOrder: 0 },
        ],
      });

      const repository = createCustomPropertiesRepository({ db });

      await repository.deletePropertyDefinition({ propertyDefinitionId: 'cpd-1' });

      const { options } = await repository.getSelectOptionsByDefinitionId({ propertyDefinitionId: 'cpd-1' });

      expect(options).to.have.length(0);
    });
  });
});
