import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';
import {
  buildAiExtractionSchema,
  buildAiExtractionSystemPrompt,
  buildAiExtractionUserPrompt,
  getExtractableCustomProperties,
  getPendingExtractionTargets,
  parseExtractedDocumentDate,
  resolveExtractedCustomPropertyValues,
  resolveExtractedFileName,
  shouldPromptForExtraction,
} from './ai-extraction.models';

const vendorProperty = {
  id: 'cpd_vendor',
  key: 'vendor',
  name: 'Vendor',
  description: 'The company that issued the document',
  type: 'text' as const,
  options: [],
};

const amountProperty = {
  id: 'cpd_amount',
  key: 'amount',
  name: 'Amount',
  description: 'Total amount including tax',
  type: 'number' as const,
  options: [],
};

const paidProperty = {
  id: 'cpd_paid',
  key: 'paid',
  name: 'Paid',
  type: 'boolean' as const,
  options: [],
};

const categoryProperty = {
  id: 'cpd_category',
  key: 'category',
  name: 'Category',
  description: null,
  type: 'select' as const,
  options: [
    { id: 'opt_invoice', name: 'Invoice' },
    { id: 'opt_letter', name: 'Letter' },
  ],
};

const tagsProperty = {
  id: 'cpd_tags',
  key: 'labels',
  name: 'Labels',
  type: 'multi_select' as const,
  options: [
    { id: 'opt_urgent', name: 'Urgent' },
    { id: 'opt_review', name: 'Review' },
  ],
};

const enabledSettings = {
  isEnabled: true,
  extractDate: true,
  extractCustomProperties: true,
  renameDocuments: true,
  filenamePattern: '{date} - {vendor}',
};

describe('ai-extraction.models', () => {
  describe('getExtractableCustomProperties', () => {
    test('keeps supported types and drops relation properties and selects without options', () => {
      expect(
        getExtractableCustomProperties({
          propertyDefinitions: [
            vendorProperty,
            {
              id: 'cpd_owner',
              key: 'owner',
              name: 'Owner',
              type: 'user_relation',
              options: [],
            },
            {
              id: 'cpd_empty',
              key: 'status',
              name: 'Status',
              type: 'select',
              options: [],
            },
            {
              id: 'cpd_related',
              key: 'related',
              name: 'Related document',
              type: 'document_relation',
              options: [],
            },
            categoryProperty,
          ],
        }),
      ).to.eql([vendorProperty, categoryProperty]);
    });
  });

  describe('getPendingExtractionTargets', () => {
    test('only extracts missing date, unset custom properties, and unrenamed documents', () => {
      expect(
        getPendingExtractionTargets({
          document: {
            name: 'scan.pdf',
            originalName: 'scan.pdf',
            documentDate: null,
          },
          settings: enabledSettings,
          extractableProperties: [vendorProperty, amountProperty],
          existingPropertyDefinitionIds: new Set(['cpd_vendor']),
        }),
      ).to.eql({
        shouldExtractDate: true,
        shouldExtractCustomProperties: true,
        shouldRename: true,
        propertiesToExtract: [amountProperty],
      });
    });

    test('skips work that is already done or disabled', () => {
      expect(
        getPendingExtractionTargets({
          document: {
            name: '2024-03-12 Acme Invoice.pdf',
            originalName: 'scan.pdf',
            documentDate: new Date('2024-03-12T00:00:00.000Z'),
          },
          settings: {
            ...enabledSettings,
            extractCustomProperties: false,
            renameDocuments: true,
          },
          extractableProperties: [vendorProperty],
          existingPropertyDefinitionIds: new Set(),
        }),
      ).to.eql({
        shouldExtractDate: false,
        shouldExtractCustomProperties: false,
        shouldRename: false,
        propertiesToExtract: [],
      });
    });
  });

  describe('shouldPromptForExtraction', () => {
    test('is false when nothing is pending', () => {
      expect(
        shouldPromptForExtraction({
          targets: {
            shouldExtractDate: false,
            shouldExtractCustomProperties: false,
            shouldRename: false,
            propertiesToExtract: [],
          },
        }),
      ).to.eql(false);
    });
  });

  describe('buildAiExtractionSystemPrompt', () => {
    test('includes date, custom properties, and filename pattern instructions', () => {
      expect(
        buildAiExtractionSystemPrompt({
          filenamePattern: '{date} - {vendor}',
          targets: {
            shouldExtractDate: true,
            shouldExtractCustomProperties: true,
            shouldRename: true,
            propertiesToExtract: [vendorProperty, categoryProperty],
          },
        }),
      ).toMatchInlineSnapshot(`
        "You extract structured metadata from documents.

        Rules:
        - Only extract values that are clearly present in the document. Prefer null over guessing.
        - Dates must be ISO 8601 calendar dates (YYYY-MM-DD).
        - documentDate should be the primary date of the document (invoice date, letter date, contract date). Ignore unrelated dates such as due dates unless that is the only date present.

        Custom properties to extract:
        - vendor (text, name: "Vendor"): The company that issued the document.
        - category (select, name: "Category"). Options: Invoice, Letter.
        - For select and multi_select properties, only use the listed option names.
        - Omit a custom property or set it to null when the value is not present in the document.

        Filename:
        - Follow this naming pattern: {date} - {vendor}
        - Replace placeholders with values extracted from the document. If a placeholder cannot be filled, omit that segment rather than inventing a value.
        - Do not include a directory path or directory separators.
        - You may omit the file extension; it will be preserved from the original filename."
      `);
    });

    test('asks the model to invent a descriptive name when no pattern is configured', () => {
      expect(
        buildAiExtractionSystemPrompt({
          filenamePattern: '',
          targets: {
            shouldExtractDate: false,
            shouldExtractCustomProperties: false,
            shouldRename: true,
            propertiesToExtract: [],
          },
        }),
      ).toMatchInlineSnapshot(`
        "You extract structured metadata from documents.

        Rules:
        - Only extract values that are clearly present in the document. Prefer null over guessing.
        - Dates must be ISO 8601 calendar dates (YYYY-MM-DD).

        Filename:
        - Generate a concise, descriptive filename based on the document content (for example "2024-03-12 Acme Invoice").
        - Do not include a directory path or directory separators.
        - You may omit the file extension; it will be preserved from the original filename."
      `);
    });
  });

  describe('buildAiExtractionUserPrompt', () => {
    test('includes the current name, original filename, and content', () => {
      expect(
        buildAiExtractionUserPrompt({
          document: {
            name: 'scan.pdf',
            originalName: 'IMG_1234.pdf',
            content: 'Invoice from Acme',
          },
        }),
      ).toMatchInlineSnapshot(`
        "Document name: scan.pdf
        Original filename: IMG_1234.pdf
        Document content:
        Invoice from Acme"
      `);
    });
  });

  describe('buildAiExtractionSchema', () => {
    test('only includes fields that still need to be extracted', () => {
      const schema = buildAiExtractionSchema({
        targets: {
          shouldExtractDate: true,
          shouldExtractCustomProperties: true,
          shouldRename: false,
          propertiesToExtract: [vendorProperty, amountProperty],
        },
      });

      expect(
        v.safeParse(schema, {
          documentDate: '2024-03-12',
          customProperties: { vendor: 'Acme', amount: 10 },
        }).success,
      ).to.eql(true);

      expect(v.safeParse(schema, { documentDate: 'March 12, 2024' }).success).to.eql(false);
    });

    test('converts to JSON Schema for structured model output', () => {
      const schema = buildAiExtractionSchema({
        targets: {
          shouldExtractDate: true,
          shouldExtractCustomProperties: true,
          shouldRename: true,
          propertiesToExtract: [vendorProperty, amountProperty],
        },
      });

      expect(toJsonSchema(schema)).to.include({ type: 'object' });
    });
  });

  describe('parseExtractedDocumentDate', () => {
    test('parses a calendar date as UTC midnight', () => {
      expect(parseExtractedDocumentDate({ value: '2024-03-12' })).to.eql(
        new Date('2024-03-12T00:00:00.000Z'),
      );
    });

    test('rejects empty or invalid values', () => {
      expect(parseExtractedDocumentDate({ value: null })).to.eql(undefined);
      expect(parseExtractedDocumentDate({ value: 'not-a-date' })).to.eql(undefined);
      expect(parseExtractedDocumentDate({ value: '' })).to.eql(undefined);
    });

    test('rejects impossible calendar dates that JS would otherwise roll over', () => {
      expect(parseExtractedDocumentDate({ value: '2024-02-31' })).to.eql(undefined);
      expect(parseExtractedDocumentDate({ value: '2023-06-31' })).to.eql(undefined);
    });
  });

  describe('resolveExtractedFileName', () => {
    test('keeps the original extension when the model omits it', () => {
      expect(
        resolveExtractedFileName({
          proposedName: '2024-03-12 Acme Invoice',
          originalName: 'scan.pdf',
        }),
      ).to.eql('2024-03-12 Acme Invoice.pdf');
    });

    test('sanitizes unsafe characters and ignores no-op renames', () => {
      expect(
        resolveExtractedFileName({
          proposedName: 'acme/invoice:final',
          originalName: 'scan.pdf',
        }),
      ).to.eql('acme_invoice_final.pdf');

      expect(
        resolveExtractedFileName({
          proposedName: 'scan.pdf',
          originalName: 'scan.pdf',
        }),
      ).to.eql(undefined);
    });

    test('returns undefined for empty or extension-only names', () => {
      expect(resolveExtractedFileName({ proposedName: '   ', originalName: 'scan.pdf' })).to.eql(
        undefined,
      );
      expect(resolveExtractedFileName({ proposedName: '.pdf', originalName: 'scan.pdf' })).to.eql(
        undefined,
      );
    });
  });

  describe('resolveExtractedCustomPropertyValues', () => {
    test('maps extracted values onto property definition ids, including select options', () => {
      expect(
        resolveExtractedCustomPropertyValues({
          propertiesToExtract: [
            vendorProperty,
            amountProperty,
            paidProperty,
            categoryProperty,
            tagsProperty,
          ],
          response: {
            customProperties: {
              vendor: 'Acme',
              amount: 42.5,
              paid: true,
              category: 'invoice',
              labels: ['Urgent', 'Unknown'],
              ignored: 'nope',
            },
          },
        }),
      ).to.eql([
        { propertyDefinitionId: 'cpd_vendor', value: 'Acme' },
        { propertyDefinitionId: 'cpd_amount', value: 42.5 },
        { propertyDefinitionId: 'cpd_paid', value: true },
        { propertyDefinitionId: 'cpd_category', value: 'opt_invoice' },
        { propertyDefinitionId: 'cpd_tags', value: ['opt_urgent'] },
      ]);
    });

    test('skips missing, empty, and unknown values', () => {
      expect(
        resolveExtractedCustomPropertyValues({
          propertiesToExtract: [vendorProperty, amountProperty, categoryProperty],
          response: {
            customProperties: {
              vendor: '',
              amount: Number.NaN,
              category: 'Unknown',
            },
          },
        }),
      ).to.eql([]);
    });
  });
});
