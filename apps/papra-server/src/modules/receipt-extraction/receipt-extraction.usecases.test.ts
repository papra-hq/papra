import { describe, expect, test, vi } from 'vitest';
import type { AiServices } from '../ai/ai.services';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createCustomPropertiesRepository } from '../custom-properties/custom-properties.repository';
import { createCustomPropertiesOptionsRepository } from '../custom-properties/options/custom-properties-options.repository';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { eq } from 'drizzle-orm';
import { extractReceiptData } from './receipt-extraction.usecases';

const receiptDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'IMG_2031.jpg',
  originalName: 'IMG_2031.jpg',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'image/jpeg',
  content: 'LOBLAWS KANATA\n2026-09-01\nSUBTOTAL 51.14\nHST 13% 3.10\nTOTAL 54.24\nVISA',
};

async function setup({
  response,
  seed = {},
}: {
  response: unknown;
  seed?: Parameters<typeof createInMemoryDatabase>[0];
}) {
  const { db } = await createInMemoryDatabase({
    organizations: [{ id: 'org_1', name: 'Org 1' }],
    documents: [receiptDocument],
    ...seed,
  });
  const generateStructuredData = vi.fn().mockResolvedValue(response);
  const { logger } = createTestLogger();
  const customPropertiesRepository = createCustomPropertiesRepository({ db });
  const tagsRepository = createTagsRepository({ db });

  const run = async () =>
    extractReceiptData({
      documentId: 'doc_1',
      organizationId: 'org_1',
      aiServices: { generateStructuredData } as AiServices,
      documentsRepository: createDocumentsRepository({ db }),
      customPropertiesRepository,
      customPropertiesOptionsRepository: createCustomPropertiesOptionsRepository({ db }),
      organizationsRepository: createOrganizationsRepository({ db }),
      tagsRepository,
      eventServices: createTestEventServices(),
      config: overrideConfig({
        receiptExtraction: { isEnabled: true, modelId: 'anthropic://test-model' },
      }),
      now: new Date('2026-09-10T12:00:00.000Z'),
      logger,
    });

  const getValues = async () => {
    const { values } = await customPropertiesRepository.getDocumentCustomPropertyValues({
      documentId: 'doc_1',
    });
    return Object.fromEntries(
      values.map(({ definition, value, option }) => [
        definition.name,
        option?.name ?? value.textValue ?? value.numberValue ?? value.dateValue?.toISOString(),
      ]),
    );
  };

  return { db, run, getValues, generateStructuredData, tagsRepository, customPropertiesRepository };
}

const receiptResponse = {
  isReceipt: true,
  vendor: 'Loblaws',
  date: '2026-09-01',
  total: 54.24,
  tax: 3.1,
  currency: 'CAD',
  paymentMethod: 'Visa',
  category: 'Groceries',
};

describe('receipt-extraction usecases', () => {
  describe('extractReceiptData', () => {
    test('a detected receipt gets its properties created, values set and the Receipt tag applied', async () => {
      const { db, run, getValues, generateStructuredData } = await setup({
        response: receiptResponse,
      });

      const result = await run();

      expect(result.isReceipt).toBe(true);
      expect(generateStructuredData).toHaveBeenCalledOnce();
      expect(generateStructuredData.mock.calls[0]?.[0]).toMatchObject({
        modelId: 'anthropic://test-model',
        source: 'receipt-extraction',
        organizationId: 'org_1',
      });

      expect(await getValues()).toEqual({
        'Vendor': 'Loblaws',
        'Receipt date': '2026-09-01T00:00:00.000Z',
        'Total': 54.24,
        'Tax': 3.1,
        'Currency': 'CAD',
        'Payment method': 'Visa',
        'Expense category': 'Groceries',
      });

      const documentTags = await db
        .select({ name: tagsTable.name })
        .from(documentsTagsTable)
        .innerJoin(tagsTable, eq(documentsTagsTable.tagId, tagsTable.id))
        .where(eq(documentsTagsTable.documentId, 'doc_1'));
      expect(documentTags).toEqual([{ name: 'Receipt' }]);
    });

    test('non receipts create nothing', async () => {
      const { run, customPropertiesRepository, tagsRepository } = await setup({
        response: { ...receiptResponse, isReceipt: false },
      });

      expect(await run()).toEqual({ isReceipt: false });

      const { propertyDefinitions } =
        await customPropertiesRepository.getOrganizationPropertyDefinitions({
          organizationId: 'org_1',
        });
      expect(propertyDefinitions).toEqual([]);

      const { tags } = await tagsRepository.getOrganizationTags({ organizationId: 'org_1' });
      expect(tags).toEqual([]);
    });

    test('existing properties are reused, manually set values are kept, user properties with a clashing type are left alone', async () => {
      const { run, getValues, customPropertiesRepository } = await setup({
        response: receiptResponse,
        seed: {
          customPropertyDefinitions: [
            {
              id: 'cpd_vendor',
              organizationId: 'org_1',
              name: 'Vendor',
              key: 'vendor',
              type: 'text',
            },
            { id: 'cpd_total', organizationId: 'org_1', name: 'Total', key: 'total', type: 'text' },
          ],
          documentCustomPropertyValues: [
            {
              id: 'dcpv_1',
              documentId: 'doc_1',
              propertyDefinitionId: 'cpd_vendor',
              textValue: 'Loblaws #1234',
            },
          ],
        },
      });

      await run();

      const values = await getValues();
      expect(values.Vendor).toBe('Loblaws #1234');
      expect(values.Total).toBeUndefined();
      expect(values.Tax).toBe(3.1);

      const { propertyDefinitions } =
        await customPropertiesRepository.getOrganizationPropertyDefinitions({
          organizationId: 'org_1',
        });
      expect(propertyDefinitions.filter((d) => d.key === 'total')).toHaveLength(1);
    });

    test('documents without extracted text skip the AI call', async () => {
      const { run, generateStructuredData } = await setup({
        response: receiptResponse,
        seed: { documents: [{ ...receiptDocument, content: '   ' }] },
      });

      expect(await run()).toEqual({ isReceipt: false });
      expect(generateStructuredData).not.toHaveBeenCalled();
    });
  });
});
