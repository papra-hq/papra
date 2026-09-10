import { describe, expect, test } from 'vitest';
import {
  buildReceiptExtractionUserPrompt,
  buildReceiptValuesToWrite,
  getCategoryOptionsToSync,
  matchReceiptPropertyDefinitions,
  normalizeReceiptExtraction,
  parseReceiptDate,
} from './receipt-extraction.models';
import type { ReceiptField } from './receipt-extraction.constants';
import { MAX_CONTENT_CHARS } from './receipt-extraction.constants';

const now = new Date('2026-09-10T12:00:00.000Z');
const categories = ['Groceries', 'Dining', 'Other'];

const baseResponse = {
  isReceipt: true,
  vendor: '  Loblaws   Kanata ',
  date: '2026-09-01',
  total: 54.237,
  tax: 3.1,
  currency: 'cad',
  paymentMethod: 'Visa',
  category: 'groceries',
};

describe('receipt-extraction.models', () => {
  describe('parseReceiptDate', () => {
    test('valid ISO dates are parsed as UTC midnight', () => {
      expect(parseReceiptDate({ value: '2026-09-01', now })?.toISOString()).toBe(
        '2026-09-01T00:00:00.000Z',
      );
    });

    test('rolled over, malformed, future and very old dates are rejected', () => {
      expect(parseReceiptDate({ value: '2024-02-30', now })).toBeUndefined();
      expect(parseReceiptDate({ value: '01/09/2026', now })).toBeUndefined();
      expect(parseReceiptDate({ value: '2027-01-01', now })).toBeUndefined();
      expect(parseReceiptDate({ value: '1985-05-05', now })).toBeUndefined();
      expect(parseReceiptDate({ value: null, now })).toBeUndefined();
    });

    test('one day in the future is tolerated for timezone differences', () => {
      expect(parseReceiptDate({ value: '2026-09-11', now })).toBeDefined();
    });
  });

  describe('normalizeReceiptExtraction', () => {
    test('cleans text, rounds amounts, uppercases currency and matches category case insensitively', () => {
      expect(normalizeReceiptExtraction({ response: baseResponse, categories, now })).toEqual({
        isReceipt: true,
        fields: {
          vendor: 'Loblaws Kanata',
          date: new Date('2026-09-01T00:00:00.000Z'),
          total: 54.24,
          tax: 3.1,
          currency: 'CAD',
          paymentMethod: 'Visa',
          category: 'Groceries',
        },
      });
    });

    test('non receipts return no fields even if the model filled some', () => {
      expect(
        normalizeReceiptExtraction({
          response: { ...baseResponse, isReceipt: false },
          categories,
          now,
        }),
      ).toEqual({ isReceipt: false, fields: {} });
    });

    test('garbage responses are treated as non receipts', () => {
      expect(normalizeReceiptExtraction({ response: 'nope', categories, now }).isReceipt).toBe(
        false,
      );
      expect(normalizeReceiptExtraction({ response: null, categories, now }).isReceipt).toBe(false);
    });

    test('tax larger than total, symbol currencies and unknown categories are dropped', () => {
      const { fields } = normalizeReceiptExtraction({
        response: { ...baseResponse, tax: 99, currency: '$', category: 'Spaceships' },
        categories,
        now,
      });

      expect(fields.tax).toBeUndefined();
      expect(fields.currency).toBeUndefined();
      expect(fields.category).toBeUndefined();
      expect(fields.total).toBe(54.24);
    });

    test('null fields are omitted', () => {
      const { fields } = normalizeReceiptExtraction({
        response: {
          isReceipt: true,
          vendor: null,
          date: null,
          total: 12,
          tax: null,
          currency: null,
          paymentMethod: '',
          category: null,
        },
        categories,
        now,
      });

      expect(fields).toEqual({ total: 12 });
    });
  });

  describe('buildReceiptExtractionUserPrompt', () => {
    test('very long content is truncated', () => {
      const prompt = buildReceiptExtractionUserPrompt({
        document: { name: 'scan.jpg', content: 'a'.repeat(MAX_CONTENT_CHARS + 500) },
      });

      expect(prompt.endsWith('[truncated]')).toBe(true);
      expect(prompt.length).toBeLessThan(MAX_CONTENT_CHARS + 100);
    });
  });

  describe('matchReceiptPropertyDefinitions', () => {
    test('existing properties are matched by key and type, same key with another type is a conflict', () => {
      const { matched, missing, conflicting } = matchReceiptPropertyDefinitions({
        propertyDefinitions: [
          { id: 'cpd_1', key: 'vendor', type: 'text' },
          { id: 'cpd_2', key: 'total', type: 'text' },
          { id: 'cpd_3', key: 'receiptdate', type: 'date' },
        ],
      });

      expect([...matched.keys()]).toEqual(['vendor', 'date']);
      expect(conflicting).toEqual(['total']);
      expect(missing).toEqual(['tax', 'currency', 'paymentMethod', 'category']);
    });
  });

  describe('getCategoryOptionsToSync', () => {
    test('nothing to sync when every category already exists', () => {
      expect(
        getCategoryOptionsToSync({
          existingOptions: [
            { id: 'o1', name: 'groceries' },
            { id: 'o2', name: 'Dining' },
            { id: 'o3', name: 'Other' },
          ],
          categories,
        }),
      ).toEqual({ optionsToSync: undefined });
    });

    test('existing options are kept with their ids and missing ones are appended', () => {
      expect(
        getCategoryOptionsToSync({
          existingOptions: [
            { id: 'o1', name: 'Custom' },
            { id: 'o2', name: 'Dining' },
          ],
          categories,
        }),
      ).toEqual({
        optionsToSync: [
          { id: 'o1', name: 'Custom' },
          { id: 'o2', name: 'Dining' },
          { name: 'Groceries' },
          { name: 'Other' },
        ],
      });
    });
  });

  describe('buildReceiptValuesToWrite', () => {
    const definitionsByField = new Map<
      ReceiptField,
      { id: string; key: string; type: string; options?: { id: string; name: string }[] }
    >([
      ['vendor', { id: 'cpd_vendor', key: 'vendor', type: 'text' }],
      ['date', { id: 'cpd_date', key: 'receiptdate', type: 'date' }],
      ['total', { id: 'cpd_total', key: 'total', type: 'number' }],
      [
        'category',
        {
          id: 'cpd_cat',
          key: 'expensecategory',
          type: 'select',
          options: [{ id: 'opt_g', name: 'Groceries' }],
        },
      ],
    ]);

    const fields = {
      vendor: 'Loblaws',
      date: new Date('2026-09-01T00:00:00.000Z'),
      total: 54.24,
      tax: 3.1,
      category: 'Groceries',
    };

    test('maps fields to property values, category resolves to the option id, fields without definition are skipped', () => {
      const { values } = buildReceiptValuesToWrite({
        fields,
        definitionsByField: new Map(definitionsByField),
        propertyDefinitionIdsWithValues: new Set(),
        overwriteExistingValues: false,
      });

      expect(values).toEqual([
        { field: 'vendor', propertyDefinitionId: 'cpd_vendor', value: 'Loblaws' },
        { field: 'date', propertyDefinitionId: 'cpd_date', value: '2026-09-01T00:00:00.000Z' },
        { field: 'total', propertyDefinitionId: 'cpd_total', value: 54.24 },
        { field: 'category', propertyDefinitionId: 'cpd_cat', value: 'opt_g' },
      ]);
    });

    test('values already set on the document are preserved unless overwrite is enabled', () => {
      const args = {
        fields,
        definitionsByField: new Map(definitionsByField),
        propertyDefinitionIdsWithValues: new Set(['cpd_vendor', 'cpd_total']),
      };

      expect(
        buildReceiptValuesToWrite({ ...args, overwriteExistingValues: false }).values.map(
          (v) => v.field,
        ),
      ).toEqual(['date', 'category']);

      expect(
        buildReceiptValuesToWrite({ ...args, overwriteExistingValues: true }).values.map(
          (v) => v.field,
        ),
      ).toEqual(['vendor', 'date', 'total', 'category']);
    });
  });
});
