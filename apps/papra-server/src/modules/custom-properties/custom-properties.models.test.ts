import { describe, expect, test } from 'vitest';
import { aggregateDocumentCustomPropertyValues, buildCustomPropertiesArray } from './custom-properties.models';

const baseValue = { userId: null, relatedDocumentId: null } as const;
const baseRow = { relatedUser: null, relatedDocument: null } as const;

describe('custom-properties models', () => {
  describe('aggregateDocumentCustomPropertyValues', () => {
    test('aggregates scalar property values', () => {
      const result = aggregateDocumentCustomPropertyValues({
        rawValues: [
          {
            value: { id: 'v1', propertyDefinitionId: 'cpd_a', textValue: 'hello', numberValue: null, dateValue: null, booleanValue: null, selectOptionId: null, ...baseValue },
            definition: { id: 'cpd_a', name: 'Name', key: 'name', type: 'text' },
            option: null,
            ...baseRow,
          },
          {
            value: { id: 'v2', propertyDefinitionId: 'cpd_b', textValue: null, numberValue: 42, dateValue: null, booleanValue: null, selectOptionId: null, ...baseValue },
            definition: { id: 'cpd_b', name: 'Amount', key: 'amount', type: 'number' },
            option: null,
            ...baseRow,
          },
        ],
      });

      expect(result).to.eql([
        { propertyDefinitionId: 'cpd_a', key: 'name', name: 'Name', type: 'text', value: 'hello' },
        { propertyDefinitionId: 'cpd_b', key: 'amount', name: 'Amount', type: 'number', value: 42 },
      ]);
    });

    test('aggregates select property values', () => {
      const result = aggregateDocumentCustomPropertyValues({
        rawValues: [
          {
            value: { id: 'v1', propertyDefinitionId: 'cpd_a', textValue: null, numberValue: null, dateValue: null, booleanValue: null, selectOptionId: 'cpso_x', ...baseValue },
            definition: { id: 'cpd_a', name: 'Category', key: 'category', type: 'select' },
            option: { id: 'cpso_x', name: 'Finance' },
            ...baseRow,
          },
        ],
      });

      expect(result).to.eql([
        { propertyDefinitionId: 'cpd_a', key: 'category', name: 'Category', type: 'select', value: { optionId: 'cpso_x', name: 'Finance' } },
      ]);
    });

    test('aggregates multi-select property values into arrays', () => {
      const result = aggregateDocumentCustomPropertyValues({
        rawValues: [
          {
            value: { id: 'v1', propertyDefinitionId: 'cpd_a', textValue: null, numberValue: null, dateValue: null, booleanValue: null, selectOptionId: 'cpso_1', ...baseValue },
            definition: { id: 'cpd_a', name: 'Labels', key: 'labels', type: 'multi_select' },
            option: { id: 'cpso_1', name: 'Urgent' },
            ...baseRow,
          },
          {
            value: { id: 'v2', propertyDefinitionId: 'cpd_a', textValue: null, numberValue: null, dateValue: null, booleanValue: null, selectOptionId: 'cpso_2', ...baseValue },
            definition: { id: 'cpd_a', name: 'Labels', key: 'labels', type: 'multi_select' },
            option: { id: 'cpso_2', name: 'Review' },
            ...baseRow,
          },
        ],
      });

      expect(result).to.eql([
        {
          propertyDefinitionId: 'cpd_a',
          key: 'labels',
          name: 'Labels',
          type: 'multi_select',
          value: [
            { optionId: 'cpso_1', name: 'Urgent' },
            { optionId: 'cpso_2', name: 'Review' },
          ],
        },
      ]);
    });

    test('returns an empty array for no values', () => {
      expect(aggregateDocumentCustomPropertyValues({ rawValues: [] })).to.eql([]);
    });
  });

  describe('buildCustomPropertiesArray', () => {
    const def = (key: string, name: string, type: string, displayOrder: number) => ({ key, name, type, displayOrder });

    test('returns an array with definition info and values', () => {
      const result = buildCustomPropertiesArray({
        propertyDefinitions: [def('name', 'Name', 'text', 0), def('amount', 'Amount', 'number', 1)],
        rawValues: [
          {
            value: { id: 'v1', propertyDefinitionId: 'cpd_a', textValue: 'hello', numberValue: null, dateValue: null, booleanValue: null, selectOptionId: null, ...baseValue },
            definition: { id: 'cpd_a', name: 'Name', key: 'name', type: 'text' },
            option: null,
            ...baseRow,
          },
          {
            value: { id: 'v2', propertyDefinitionId: 'cpd_b', textValue: null, numberValue: 42, dateValue: null, booleanValue: null, selectOptionId: null, ...baseValue },
            definition: { id: 'cpd_b', name: 'Amount', key: 'amount', type: 'number' },
            option: null,
            ...baseRow,
          },
        ],
      });

      expect(result).to.eql([
        { key: 'name', name: 'Name', type: 'text', displayOrder: 0, value: 'hello' },
        { key: 'amount', name: 'Amount', type: 'number', displayOrder: 1, value: 42 },
      ]);
    });

    test('includes null value for definitions with no value set', () => {
      const result = buildCustomPropertiesArray({
        propertyDefinitions: [def('name', 'Name', 'text', 0), def('amount', 'Amount', 'number', 1)],
        rawValues: [
          {
            value: { id: 'v1', propertyDefinitionId: 'cpd_a', textValue: 'hello', numberValue: null, dateValue: null, booleanValue: null, selectOptionId: null, ...baseValue },
            definition: { id: 'cpd_a', name: 'Name', key: 'name', type: 'text' },
            option: null,
            ...baseRow,
          },
        ],
      });

      expect(result).to.eql([
        { key: 'name', name: 'Name', type: 'text', displayOrder: 0, value: 'hello' },
        { key: 'amount', name: 'Amount', type: 'number', displayOrder: 1, value: null },
      ]);
    });

    test('returns all nulls when no values are set', () => {
      expect(buildCustomPropertiesArray({
        propertyDefinitions: [def('name', 'Name', 'text', 0), def('amount', 'Amount', 'number', 1)],
        rawValues: [],
      })).to.eql([
        { key: 'name', name: 'Name', type: 'text', displayOrder: 0, value: null },
        { key: 'amount', name: 'Amount', type: 'number', displayOrder: 1, value: null },
      ]);
    });

    test('returns an empty array when there are no definitions', () => {
      expect(buildCustomPropertiesArray({ propertyDefinitions: [], rawValues: [] })).to.eql([]);
    });
  });
});
