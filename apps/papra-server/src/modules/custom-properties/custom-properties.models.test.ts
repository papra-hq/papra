import { describe, expect, test } from 'vitest';
import { CUSTOM_PROPERTY_TYPES } from './custom-properties.constants';
import {
  extractTypedValue,
  formatDocumentPropertyValuesForApi,
  isSelectLikeType,
} from './custom-properties.models';

describe('custom-properties models', () => {
  describe('isSelectLikeType', () => {
    test('select type is a select-like type', () => {
      expect(isSelectLikeType({ type: CUSTOM_PROPERTY_TYPES.SELECT })).to.eql(true);
    });

    test('multi_select type is a select-like type', () => {
      expect(isSelectLikeType({ type: CUSTOM_PROPERTY_TYPES.MULTI_SELECT })).to.eql(true);
    });

    test('text type is not a select-like type', () => {
      expect(isSelectLikeType({ type: CUSTOM_PROPERTY_TYPES.TEXT })).to.eql(false);
    });

    test('number type is not a select-like type', () => {
      expect(isSelectLikeType({ type: CUSTOM_PROPERTY_TYPES.NUMBER })).to.eql(false);
    });

    test('date type is not a select-like type', () => {
      expect(isSelectLikeType({ type: CUSTOM_PROPERTY_TYPES.DATE })).to.eql(false);
    });

    test('boolean type is not a select-like type', () => {
      expect(isSelectLikeType({ type: CUSTOM_PROPERTY_TYPES.BOOLEAN })).to.eql(false);
    });
  });

  describe('extractTypedValue', () => {
    const basePropertyValue = {
      id: 'dcpv-1',
      documentId: 'doc-1',
      propertyDefinitionId: 'cpd-1',
      textValue: null,
      numberValue: null,
      dateValue: null,
      booleanValue: null,
      selectOptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test('text type extracts textValue', () => {
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, textValue: 'hello' },
        type: CUSTOM_PROPERTY_TYPES.TEXT,
      });

      expect(value).to.eql('hello');
    });

    test('number type extracts numberValue', () => {
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, numberValue: 42 },
        type: CUSTOM_PROPERTY_TYPES.NUMBER,
      });

      expect(value).to.eql(42);
    });

    test('date type extracts dateValue', () => {
      const date = new Date('2025-01-01');
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, dateValue: date },
        type: CUSTOM_PROPERTY_TYPES.DATE,
      });

      expect(value).to.eql(date);
    });

    test('boolean type extracts booleanValue', () => {
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, booleanValue: true },
        type: CUSTOM_PROPERTY_TYPES.BOOLEAN,
      });

      expect(value).to.eql(true);
    });

    test('select type extracts option object when selectOption is provided', () => {
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, selectOptionId: 'cpso-1' },
        type: CUSTOM_PROPERTY_TYPES.SELECT,
        selectOption: { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Active', color: '#00FF00', displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      });

      expect(value).to.eql({ id: 'cpso-1', value: 'Active', color: '#00FF00' });
    });

    test('select type returns null when selectOption is not provided', () => {
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, selectOptionId: 'cpso-1' },
        type: CUSTOM_PROPERTY_TYPES.SELECT,
      });

      expect(value).to.eql(null);
    });

    test('multi_select type extracts option object when selectOption is provided', () => {
      const value = extractTypedValue({
        propertyValue: { ...basePropertyValue, selectOptionId: 'cpso-1' },
        type: CUSTOM_PROPERTY_TYPES.MULTI_SELECT,
        selectOption: { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Finance', color: null, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      });

      expect(value).to.eql({ id: 'cpso-1', value: 'Finance', color: null });
    });

    test('unknown type returns null', () => {
      const value = extractTypedValue({
        propertyValue: basePropertyValue,
        type: 'unknown_type',
      });

      expect(value).to.eql(null);
    });
  });

  describe('formatDocumentPropertyValuesForApi', () => {
    const now = new Date();

    test('text values are formatted correctly', () => {
      const result = formatDocumentPropertyValuesForApi({
        propertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: 'Acme', numberValue: null, dateValue: null, booleanValue: null, selectOptionId: null, createdAt: now, updatedAt: now },
        ],
        propertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company', type: 'text', description: null, color: null, isRequired: false, displayOrder: 0, createdAt: now, updatedAt: now },
        ],
      });

      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ propertyDefinitionId: 'cpd-1', name: 'Company', value: 'Acme' });
    });

    test('multi-select values are grouped into arrays of option objects', () => {
      const result = formatDocumentPropertyValuesForApi({
        propertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: null, numberValue: null, dateValue: null, booleanValue: null, selectOptionId: 'cpso-1', createdAt: now, updatedAt: now },
          { id: 'dcpv-2', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: null, numberValue: null, dateValue: null, booleanValue: null, selectOptionId: 'cpso-2', createdAt: now, updatedAt: now },
        ],
        propertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Categories', type: 'multi_select', description: null, color: null, isRequired: false, displayOrder: 0, createdAt: now, updatedAt: now },
          { id: 'cpd-1', organizationId: 'org-1', name: 'Categories', type: 'multi_select', description: null, color: null, isRequired: false, displayOrder: 0, createdAt: now, updatedAt: now },
        ],
        selectOptions: [
          { id: 'cpso-1', propertyDefinitionId: 'cpd-1', value: 'Finance', color: '#00FF00', displayOrder: 0, createdAt: now, updatedAt: now },
          { id: 'cpso-2', propertyDefinitionId: 'cpd-1', value: 'Legal', color: '#FF0000', displayOrder: 1, createdAt: now, updatedAt: now },
        ],
      });

      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ propertyDefinitionId: 'cpd-1', name: 'Categories', value: [{ id: 'cpso-1', value: 'Finance', color: '#00FF00' }, { id: 'cpso-2', value: 'Legal', color: '#FF0000' }] });
    });

    test('values with no matching definition are skipped', () => {
      const result = formatDocumentPropertyValuesForApi({
        propertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-orphan', textValue: 'test', numberValue: null, dateValue: null, booleanValue: null, selectOptionId: null, createdAt: now, updatedAt: now },
        ],
        propertyDefinitions: [],
      });

      expect(result).to.have.length(0);
    });

    test('multiple property types are formatted correctly together', () => {
      const result = formatDocumentPropertyValuesForApi({
        propertyValues: [
          { id: 'dcpv-1', documentId: 'doc-1', propertyDefinitionId: 'cpd-1', textValue: 'Acme', numberValue: null, dateValue: null, booleanValue: null, selectOptionId: null, createdAt: now, updatedAt: now },
          { id: 'dcpv-2', documentId: 'doc-1', propertyDefinitionId: 'cpd-2', textValue: null, numberValue: 100, dateValue: null, booleanValue: null, selectOptionId: null, createdAt: now, updatedAt: now },
          { id: 'dcpv-3', documentId: 'doc-1', propertyDefinitionId: 'cpd-3', textValue: null, numberValue: null, dateValue: new Date('2025-06-15'), booleanValue: null, selectOptionId: null, createdAt: now, updatedAt: now },
        ],
        propertyDefinitions: [
          { id: 'cpd-1', organizationId: 'org-1', name: 'Company', type: 'text', description: null, color: null, isRequired: false, displayOrder: 0, createdAt: now, updatedAt: now },
          { id: 'cpd-2', organizationId: 'org-1', name: 'Amount', type: 'number', description: null, color: null, isRequired: false, displayOrder: 1, createdAt: now, updatedAt: now },
          { id: 'cpd-3', organizationId: 'org-1', name: 'Due Date', type: 'date', description: null, color: null, isRequired: false, displayOrder: 2, createdAt: now, updatedAt: now },
        ],
      });

      expect(result).to.have.length(3);
      expect(result[0]).to.eql({ propertyDefinitionId: 'cpd-1', name: 'Company', value: 'Acme' });
      expect(result[1]).to.eql({ propertyDefinitionId: 'cpd-2', name: 'Amount', value: 100 });
      expect(result[2]).to.eql({ propertyDefinitionId: 'cpd-3', name: 'Due Date', value: new Date('2025-06-15') });
    });
  });
});
