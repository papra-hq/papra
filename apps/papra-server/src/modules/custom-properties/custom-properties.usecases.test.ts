import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import {
  createCustomPropertyDefinitionNotFoundError,
  createCustomPropertySelectOptionNotFoundError,
  createCustomPropertyValueInvalidError,
  createOrganizationCustomPropertyLimitReachedError,
} from './custom-properties.errors';
import { createCustomPropertiesRepository } from './custom-properties.repository';
import {
  checkIfOrganizationCanCreateNewPropertyDefinition,
  createPropertyDefinition,
  getPropertyDefinitionOrThrow,
  setDocumentPropertyValue,
  updatePropertyDefinition,
} from './custom-properties.usecases';

describe('custom-properties usecases', () => {
  describe('checkIfOrganizationCanCreateNewPropertyDefinition', () => {
    test('when the organization has fewer property definitions than the limit, no error is thrown', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Prop 1', type: 'text' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 5 } });

      await checkIfOrganizationCanCreateNewPropertyDefinition({
        organizationId: 'org-1',
        config,
        customPropertiesRepository,
      });
    });

    test('when the organization has reached the property definition limit, an error is thrown', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Prop 1', type: 'text' },
          { id: 'cpd-2', organizationId: 'org-1', name: 'Prop 2', type: 'number' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 2 } });

      await expect(
        checkIfOrganizationCanCreateNewPropertyDefinition({
          organizationId: 'org-1',
          config,
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createOrganizationCustomPropertyLimitReachedError());
    });

    test('property definitions from other organizations are not counted towards the limit', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org-1', name: 'Organization 1' },
          { id: 'org-2', name: 'Organization 2' },
        ],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Prop 1', type: 'text' },
          { id: 'cpd-2', organizationId: 'org-2', name: 'Prop 2', type: 'text' },
          { id: 'cpd-3', organizationId: 'org-2', name: 'Prop 3', type: 'number' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 2 } });

      await checkIfOrganizationCanCreateNewPropertyDefinition({
        organizationId: 'org-1',
        config,
        customPropertiesRepository,
      });
    });
  });

  describe('createPropertyDefinition', () => {
    test('a property definition is created when under the limit', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 5 } });

      const { propertyDefinition } = await createPropertyDefinition({
        organizationId: 'org-1',
        name: 'Company Name',
        type: 'text',
        config,
        customPropertiesRepository,
      });

      expect(propertyDefinition).to.include({
        organizationId: 'org-1',
        name: 'Company Name',
        type: 'text',
      });
      expect(propertyDefinition.options).to.have.length(0);
    });

    test('creating a property definition when the limit is reached throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Prop 1', type: 'text' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 1 } });

      await expect(
        createPropertyDefinition({
          organizationId: 'org-1',
          name: 'New Prop',
          type: 'text',
          config,
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createOrganizationCustomPropertyLimitReachedError());
    });

    test('a select property definition is created with its options', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 5 } });

      const { propertyDefinition } = await createPropertyDefinition({
        organizationId: 'org-1',
        name: 'Status',
        type: 'select',
        options: [
          { value: 'Active', color: '#00FF00' },
          { value: 'Archived', color: '#FF0000' },
        ],
        config,
        customPropertiesRepository,
      });

      expect(propertyDefinition.type).to.eql('select');
      expect(propertyDefinition.options).to.have.length(2);
      expect(propertyDefinition.options.map(o => o.value)).to.eql(['Active', 'Archived']);
    });

    test('options are ignored for non-select property types', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 5 } });

      const { propertyDefinition } = await createPropertyDefinition({
        organizationId: 'org-1',
        name: 'Notes',
        type: 'text',
        options: [{ value: 'ShouldBeIgnored' }],
        config,
        customPropertiesRepository,
      });

      expect(propertyDefinition.type).to.eql('text');
      expect(propertyDefinition.options).to.have.length(0);
    });

    test('an invalid property type throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const config = overrideConfig({ customProperties: { maxCustomPropertiesPerOrganization: 5 } });

      await expect(
        createPropertyDefinition({
          organizationId: 'org-1',
          name: 'Bad Type',
          type: 'invalid_type' as any,
          config,
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyValueInvalidError({ message: 'Invalid property type: invalid_type' }));
    });
  });

  describe('getPropertyDefinitionOrThrow', () => {
    test('the property definition is returned when it exists', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await getPropertyDefinitionOrThrow({
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        customPropertiesRepository,
      });

      expect(propertyDefinition.name).to.eql('Company Name');
    });

    test('an error is thrown when the property definition does not exist', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        getPropertyDefinitionOrThrow({
          propertyDefinitionId: 'cpd-nonexistent',
          organizationId: 'org-1',
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyDefinitionNotFoundError());
    });
  });

  describe('updatePropertyDefinition', () => {
    test('a property definition name and description can be updated', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Old Name', type: 'text' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await updatePropertyDefinition({
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        name: 'New Name',
        description: 'Updated description',
        customPropertiesRepository,
      });

      expect(propertyDefinition.name).to.eql('New Name');
      expect(propertyDefinition.description).to.eql('Updated description');
    });

    test('select options can be updated for a select property definition', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', displayOrder: 0 },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const { propertyDefinition } = await updatePropertyDefinition({
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        options: [
          { value: 'Active', color: '#00FF00' },
          { value: 'Inactive', color: '#FF0000' },
          { value: 'Pending', color: '#FFFF00' },
        ],
        customPropertiesRepository,
      });

      expect(propertyDefinition.options).to.have.length(3);
      expect(propertyDefinition.options.map(o => o.value)).to.eql(['Active', 'Inactive', 'Pending']);
    });

    test('updating a non-existent property definition throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        updatePropertyDefinition({
          propertyDefinitionId: 'cpd-nonexistent',
          organizationId: 'org-1',
          name: 'New Name',
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyDefinitionNotFoundError());
    });
  });

  describe('setDocumentPropertyValue', () => {
    test('a text value can be set on a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const result = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: 'Acme Corp',
        customPropertiesRepository,
      });

      expect((result as any).propertyValue.textValue).to.eql('Acme Corp');
    });

    test('a number value can be set on a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Amount', type: 'number' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const result = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: 42.5,
        customPropertiesRepository,
      });

      expect((result as any).propertyValue.numberValue).to.eql(42.5);
    });

    test('a boolean value can be set on a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Is Verified', type: 'boolean' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const result = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: true,
        customPropertiesRepository,
      });

      expect((result as any).propertyValue.booleanValue).to.eql(true);
    });

    test('a date value can be set on a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Expiration Date', type: 'date' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const result = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: '2025-12-31T00:00:00.000Z',
        customPropertiesRepository,
      });

      expect((result as any).propertyValue.dateValue).to.be.instanceOf(Date);
    });

    test('a select value can be set on a document when the option exists', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', displayOrder: 0 },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-1', value: 'Archived', displayOrder: 1 },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const result = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: 'cpso-1',
        customPropertiesRepository,
      });

      expect((result as any).propertyValue.selectOptionId).to.eql('cpso-1');
    });

    test('setting a select value with an invalid option ID throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Status', type: 'select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', displayOrder: 0 },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        setDocumentPropertyValue({
          documentId: 'doc-1',
          propertyDefinitionId: 'cpd-1',
          organizationId: 'org-1',
          value: 'cpso-nonexistent',
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertySelectOptionNotFoundError());
    });

    test('multi-select values can be set on a document using option IDs', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Categories', type: 'multi_select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Finance', displayOrder: 0 },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-1', value: 'Legal', displayOrder: 1 },
          { id: 'cpso-3', propertyDefinitionId: 'cpd-1', value: 'HR', displayOrder: 2 },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const { propertyValues } = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: ['cpso-1', 'cpso-2'],
        customPropertiesRepository,
      }) as { propertyValues: any[] };

      expect(propertyValues).to.have.length(2);
    });

    test('multi-select values with an invalid option ID throw an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Categories', type: 'multi_select' },
        ],
        customPropertySelectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Finance', displayOrder: 0 },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        setDocumentPropertyValue({
          documentId: 'doc-1',
          propertyDefinitionId: 'cpd-1',
          organizationId: 'org-1',
          value: ['cpso-1', 'cpso-nonexistent'],
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertySelectOptionNotFoundError());
    });

    test('setting a null value clears the property', async () => {
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

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      const result = await setDocumentPropertyValue({
        documentId: 'doc-1',
        propertyDefinitionId: 'cpd-1',
        organizationId: 'org-1',
        value: null,
        customPropertiesRepository,
      });

      expect((result as any).propertyValue).to.be.null;
    });

    test('setting a property on a non-existent definition throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        setDocumentPropertyValue({
          documentId: 'doc-1',
          propertyDefinitionId: 'cpd-nonexistent',
          organizationId: 'org-1',
          value: 'test',
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyDefinitionNotFoundError());
    });

    test('setting a wrong type value for a text property throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company Name', type: 'text' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        setDocumentPropertyValue({
          documentId: 'doc-1',
          propertyDefinitionId: 'cpd-1',
          organizationId: 'org-1',
          value: 123 as any,
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyValueInvalidError({ message: 'Text property value must be a string.' }));
    });

    test('setting a wrong type value for a number property throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Amount', type: 'number' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        setDocumentPropertyValue({
          documentId: 'doc-1',
          propertyDefinitionId: 'cpd-1',
          organizationId: 'org-1',
          value: 'not a number',
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyValueInvalidError({ message: 'Number property value must be a valid number.' }));
    });

    test('setting a wrong type value for a boolean property throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'test.pdf', originalName: 'test.pdf', mimeType: 'application/pdf', originalStorageKey: 'key', originalSha256Hash: 'hash1' }],
        customPropertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Is Verified', type: 'boolean' },
        ],
      });

      const customPropertiesRepository = createCustomPropertiesRepository({ db });

      await expect(
        setDocumentPropertyValue({
          documentId: 'doc-1',
          propertyDefinitionId: 'cpd-1',
          organizationId: 'org-1',
          value: 'not a boolean',
          customPropertiesRepository,
        }),
      ).rejects.toThrow(createCustomPropertyValueInvalidError({ message: 'Boolean property value must be true or false.' }));
    });
  });
});
