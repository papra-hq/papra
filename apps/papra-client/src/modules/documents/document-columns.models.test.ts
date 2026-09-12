import { describe, expect, test } from 'vitest';
import {
  deserializeDocumentColumnIds,
  formatDocumentCustomPropertyValue,
  getCustomPropertyDocumentColumnId,
  getDocumentColumnsForPicker,
  getDocumentColumnsStorageKey,
  getSelectedDocumentColumns,
  moveDocumentColumn,
  toggleDocumentColumn,
} from './document-columns.models';

describe('document columns models', () => {
  describe('column preferences', () => {
    const columns = [
      { id: 'tags' },
      { id: 'documentDate' },
      { id: 'createdAt' },
      { id: 'customProperty:property-b' },
      { id: 'customProperty:property-a' },
    ];

    test('uses an organization-specific local storage key', () => {
      expect(getDocumentColumnsStorageKey({ organizationId: 'organization-a' })).to.eql(
        'papra:documents:columns:organization-a',
      );
    });

    test('deserializes unique string IDs and rejects invalid preferences', () => {
      expect(deserializeDocumentColumnIds('["tags","customProperty:property-a","tags"]')).to.eql([
        'tags',
        'customProperty:property-a',
      ]);
      expect(deserializeDocumentColumnIds('[]')).to.eql([]);
      expect(() => deserializeDocumentColumnIds('{}')).toThrow(TypeError);
      expect(() => deserializeDocumentColumnIds('["tags",42]')).toThrow(TypeError);
    });

    test('selects columns in the configured order and ignores removed columns', () => {
      expect(
        getSelectedDocumentColumns({
          columns,
          selectedColumnIds: ['createdAt', 'removed-column', 'tags'],
        }),
      ).to.eql([columns[2], columns[0]]);
    });

    test('shows selected columns first and preserves registry order for the remaining columns', () => {
      expect(
        getDocumentColumnsForPicker({
          columns,
          selectedColumnIds: ['createdAt', 'tags'],
        }),
      ).to.eql([columns[2], columns[0], columns[1], columns[3], columns[4]]);
    });

    test('adds and removes columns without disturbing the remaining order', () => {
      expect(
        toggleDocumentColumn({
          selectedColumnIds: ['tags'],
          columnId: 'documentDate',
          isSelected: true,
        }),
      ).to.eql(['tags', 'documentDate']);
      expect(
        toggleDocumentColumn({
          selectedColumnIds: ['tags', 'documentDate'],
          columnId: 'tags',
          isSelected: false,
        }),
      ).to.eql(['documentDate']);
    });

    test('moves columns earlier and later without crossing the list bounds', () => {
      expect(
        moveDocumentColumn({
          selectedColumnIds: ['tags', 'documentDate', 'createdAt'],
          columnId: 'documentDate',
          direction: 'earlier',
        }),
      ).to.eql(['documentDate', 'tags', 'createdAt']);
      expect(
        moveDocumentColumn({
          selectedColumnIds: ['tags', 'documentDate', 'createdAt'],
          columnId: 'documentDate',
          direction: 'later',
        }),
      ).to.eql(['tags', 'createdAt', 'documentDate']);
      expect(
        moveDocumentColumn({
          selectedColumnIds: ['tags', 'documentDate'],
          columnId: 'tags',
          direction: 'earlier',
        }),
      ).to.eql(['tags', 'documentDate']);
    });

    test('preserves unavailable custom columns when toggling built-in columns', () => {
      const selectedColumnIds = ['tags', 'customProperty:property-a', 'createdAt'];
      const withoutTags = toggleDocumentColumn({
        selectedColumnIds,
        columnId: 'tags',
        isSelected: false,
      });

      expect(withoutTags).to.eql(['customProperty:property-a', 'createdAt']);
      expect(
        toggleDocumentColumn({
          selectedColumnIds: withoutTags,
          columnId: 'documentDate',
          isSelected: true,
        }),
      ).to.eql(['customProperty:property-a', 'createdAt', 'documentDate']);
    });

    test('reorders available columns without dropping unavailable saved custom columns', () => {
      const selectedColumnIds = ['tags', 'customProperty:property-a', 'createdAt'];
      const availableColumnIds = ['tags', 'documentDate', 'createdAt'];

      expect(
        moveDocumentColumn({
          selectedColumnIds,
          availableColumnIds,
          columnId: 'createdAt',
          direction: 'earlier',
        }),
      ).to.eql(['createdAt', 'customProperty:property-a', 'tags']);
      expect(
        moveDocumentColumn({
          selectedColumnIds,
          availableColumnIds,
          columnId: 'tags',
          direction: 'later',
        }),
      ).to.eql(['createdAt', 'customProperty:property-a', 'tags']);
      expect(
        moveDocumentColumn({
          selectedColumnIds,
          availableColumnIds,
          columnId: 'createdAt',
          direction: 'later',
        }),
      ).to.equal(selectedColumnIds);
      expect(selectedColumnIds).to.eql(['tags', 'customProperty:property-a', 'createdAt']);
    });

    test('names custom property column IDs without colliding with built-in columns', () => {
      expect(getCustomPropertyDocumentColumnId({ propertyDefinitionId: 'property-a' })).to.eql(
        'customProperty:property-a',
      );
    });
  });

  describe('custom property values', () => {
    const formatOptions = {
      formatDate: (date: Date) => date.toISOString().slice(0, 10),
      booleanLabels: { true: 'Yes', false: 'No' },
    };
    const formatValue = (
      type: Parameters<typeof formatDocumentCustomPropertyValue>[0]['definition']['type'],
      value: unknown,
    ) =>
      formatDocumentCustomPropertyValue({
        definition: { id: 'property-1', type },
        customProperties: [{ propertyDefinitionId: 'property-1', value }],
        ...formatOptions,
      });

    test('matches values by stable ID when cached definitions have an old key', () => {
      const definition = { id: 'property-1', type: 'text' as const, key: 'old-reference' };
      const customProperties = [
        { propertyDefinitionId: 'property-2', key: 'old-reference', value: 'Wrong property' },
        { propertyDefinitionId: 'property-1', key: 'new-reference', value: 'INV-001' },
      ];

      expect(
        formatDocumentCustomPropertyValue({ definition, customProperties, ...formatOptions }),
      ).to.eql('INV-001');
      expect(
        formatDocumentCustomPropertyValue({
          definition,
          customProperties: customProperties.slice(0, 1),
          ...formatOptions,
        }),
      ).to.eql(null);
    });

    test('formats scalar values', () => {
      expect(formatValue('text', 'Invoice')).to.eql('Invoice');
      expect(formatValue('number', 42.5)).to.eql('42.5');
      expect(formatValue('number', 0)).to.eql('0');
      expect(formatValue('date', '2026-09-06T00:00:00.000Z')).to.eql('2026-09-06');
      expect(formatValue('boolean', true)).to.eql('Yes');
      expect(formatValue('boolean', false)).to.eql('No');
    });

    test('formats select and relation values', () => {
      expect(formatValue('select', { optionId: 'option-1', name: 'Approved' })).to.eql('Approved');
      expect(
        formatValue('multi_select', [
          { optionId: 'option-1', name: 'Finance' },
          { optionId: 'option-2', name: 'Legal' },
        ]),
      ).to.eql('Finance, Legal');
      expect(
        formatValue('user_relation', [
          { userId: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' },
          { userId: 'user-2', name: null, email: 'grace@example.com' },
        ]),
      ).to.eql('Ada Lovelace, grace@example.com');
      expect(
        formatValue('document_relation', [
          { documentId: 'document-1', name: 'Contract.pdf' },
          { documentId: 'document-2', name: 'Invoice.pdf' },
        ]),
      ).to.eql('Contract.pdf, Invoice.pdf');
    });

    test('returns null for empty or invalid values', () => {
      expect(formatValue('text', '')).to.eql(null);
      expect(formatValue('date', 'not-a-date')).to.eql(null);
      expect(formatValue('multi_select', [])).to.eql(null);
      expect(formatValue('number', null)).to.eql(null);
      expect(
        formatDocumentCustomPropertyValue({
          definition: { id: 'property-1', type: 'text' },
          ...formatOptions,
        }),
      ).to.eql(null);
    });
  });
});
