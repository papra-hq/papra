import { describe, expect, test, vi } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import type { AiServices } from '../ai/ai.services';
import { overrideConfig } from '../config/config.test-utils';
import { createCustomPropertiesRepository } from '../custom-properties/custom-properties.repository';
import { createCustomPropertiesOptionsRepository } from '../custom-properties/options/custom-properties-options.repository';
import { documentCustomPropertyValuesTable } from '../custom-properties/custom-properties.table';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentsTable } from '../documents/documents.table';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { extractDocumentMetadata } from './ai-extraction.usecases';
import type { AiExtractionResponse } from './ai-extraction.models';
import { asc } from 'drizzle-orm';

function createTestResolveOrganizationSettings(
  extraction: Partial<{
    isEnabled: boolean;
    extractDate: boolean;
    extractCustomProperties: boolean;
    renameDocuments: boolean;
    filenamePattern: string;
  }> = {},
): ResolveOrganizationSettingsUsecase {
  return async () => ({
    organizationSettings: {
      ai: {
        autoTagging: {
          isEnabled: false,
          canCreateNewTags: false,
          maxTags: 5,
          modelId: 'openai://gpt-4o-mini',
        },
        extraction: {
          isEnabled: true,
          extractDate: true,
          extractCustomProperties: true,
          renameDocuments: true,
          filenamePattern: '{date} - {vendor}',
          modelId: 'openai://gpt-4o-mini',
          ...extraction,
        },
      },
    },
  });
}

function createTestAiServices({ response }: { response: AiExtractionResponse }) {
  const generateStructuredData = vi.fn().mockResolvedValue(response);

  return {
    aiServices: { generateStructuredData } as AiServices,
    generateStructuredData,
  };
}

async function createTestDeps(seedOptions: Parameters<typeof createInMemoryDatabase>[0]) {
  const { db } = await createInMemoryDatabase(seedOptions);

  return {
    db,
    documentsRepository: createDocumentsRepository({ db }),
    customPropertiesRepository: createCustomPropertiesRepository({ db }),
    customPropertiesOptionsRepository: createCustomPropertiesOptionsRepository({ db }),
    organizationsRepository: createOrganizationsRepository({ db }),
    eventServices: createTestEventServices(),
    config: overrideConfig(),
  };
}

const baseDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'scan.pdf',
  originalName: 'scan.pdf',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'application/pdf',
  content: 'Invoice from Acme Corp dated 12 March 2024. Total: 42.50.',
};

describe('ai-extraction usecases', () => {
  describe('extractDocumentMetadata', () => {
    test('when extraction is disabled in the organization settings, the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { documentDate: '2024-03-12' },
      });

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({ isEnabled: false }),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
    });

    test('when the document has no extracted content, the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ ...baseDocument, content: '' }],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { documentDate: '2024-03-12' },
      });

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
    });

    test('extracts the document date, custom properties, and filename while preserving the original name', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        customPropertyDefinitions: [
          {
            id: 'cpd_vendor',
            organizationId: 'org_1',
            name: 'Vendor',
            key: 'vendor',
            type: 'text',
            description: 'The company that issued the document',
          },
          {
            id: 'cpd_amount',
            organizationId: 'org_1',
            name: 'Amount',
            key: 'amount',
            type: 'number',
          },
        ],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          documentDate: '2024-03-12',
          filename: '2024-03-12 Acme Invoice',
          customProperties: {
            vendor: 'Acme Corp',
            amount: 42.5,
          },
        },
      });

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(generateStructuredData).toHaveBeenCalledOnce();

      const [document] = await deps.db.select().from(documentsTable);

      expect(document).toMatchObject({
        name: '2024-03-12 Acme Invoice.pdf',
        originalName: 'scan.pdf',
        documentDate: new Date('2024-03-12T00:00:00.000Z'),
      });

      const customPropertyValues = await deps.db
        .select()
        .from(documentCustomPropertyValuesTable)
        .orderBy(asc(documentCustomPropertyValuesTable.propertyDefinitionId));

      expect(
        customPropertyValues.map((value) => ({
          documentId: value.documentId,
          propertyDefinitionId: value.propertyDefinitionId,
          textValue: value.textValue,
          numberValue: value.numberValue,
        })),
      ).to.eql([
        {
          documentId: 'doc_1',
          propertyDefinitionId: 'cpd_amount',
          textValue: null,
          numberValue: 42.5,
        },
        {
          documentId: 'doc_1',
          propertyDefinitionId: 'cpd_vendor',
          textValue: 'Acme Corp',
          numberValue: null,
        },
      ]);
    });

    test('does not overwrite an existing date, custom property, or manually renamed document', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [
          {
            ...baseDocument,
            name: 'Manually renamed.pdf',
            originalName: 'scan.pdf',
            documentDate: new Date('2023-01-01T00:00:00.000Z'),
          },
        ],
        customPropertyDefinitions: [
          {
            id: 'cpd_vendor',
            organizationId: 'org_1',
            name: 'Vendor',
            key: 'vendor',
            type: 'text',
          },
        ],
        documentCustomPropertyValues: [
          {
            documentId: 'doc_1',
            propertyDefinitionId: 'cpd_vendor',
            textValue: 'Existing vendor',
          },
        ],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          documentDate: '2024-03-12',
          filename: 'Should not apply',
          customProperties: { vendor: 'Acme Corp' },
        },
      });

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();

      const [document] = await deps.db.select().from(documentsTable);
      expect(document).toMatchObject({
        name: 'Manually renamed.pdf',
        originalName: 'scan.pdf',
        documentDate: new Date('2023-01-01T00:00:00.000Z'),
      });

      const customPropertyValues = await deps.db.select().from(documentCustomPropertyValuesTable);
      expect(customPropertyValues).toMatchObject([
        {
          propertyDefinitionId: 'cpd_vendor',
          textValue: 'Existing vendor',
        },
      ]);
    });

    test('does not overwrite metadata that changed while the model is running', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        customPropertyDefinitions: [
          {
            id: 'cpd_vendor',
            organizationId: 'org_1',
            name: 'Vendor',
            key: 'vendor',
            type: 'text',
          },
        ],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          documentDate: '2024-03-12',
          filename: 'AI Invoice',
          customProperties: { vendor: 'Acme Corp' },
        },
      });

      generateStructuredData.mockImplementation(async () => {
        await deps.documentsRepository.updateDocument({
          documentId: 'doc_1',
          organizationId: 'org_1',
          name: 'User renamed.pdf',
          documentDate: new Date('2023-01-01T00:00:00.000Z'),
        });
        await deps.customPropertiesRepository.setDocumentCustomPropertyValue({
          documentId: 'doc_1',
          propertyDefinitionId: 'cpd_vendor',
          values: [{ textValue: 'User vendor' }],
        });

        return {
          documentDate: '2024-03-12',
          filename: 'AI Invoice',
          customProperties: { vendor: 'Acme Corp' },
        };
      });

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(generateStructuredData).toHaveBeenCalledOnce();

      const [document] = await deps.db.select().from(documentsTable);
      expect(document).toMatchObject({
        name: 'User renamed.pdf',
        originalName: 'scan.pdf',
        documentDate: new Date('2023-01-01T00:00:00.000Z'),
      });

      const customPropertyValues = await deps.db.select().from(documentCustomPropertyValuesTable);
      expect(customPropertyValues).toMatchObject([
        {
          propertyDefinitionId: 'cpd_vendor',
          textValue: 'User vendor',
        },
      ]);
    });

    test('does not overwrite metadata that changes after the post-model reread', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        customPropertyDefinitions: [
          {
            id: 'cpd_vendor',
            organizationId: 'org_1',
            name: 'Vendor',
            key: 'vendor',
            type: 'text',
          },
        ],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          documentDate: '2024-03-12',
          filename: 'AI Invoice',
          customProperties: { vendor: 'Acme Corp' },
        },
      });

      const originalUpdateDocument = deps.documentsRepository.updateDocument;
      deps.documentsRepository.updateDocument = async (args) => {
        if (args.expectedName !== undefined || args.expectedDocumentDate !== undefined) {
          await originalUpdateDocument({
            documentId: args.documentId,
            organizationId: args.organizationId,
            name: 'User renamed.pdf',
            documentDate: new Date('2023-01-01T00:00:00.000Z'),
          });
        }

        return originalUpdateDocument(args);
      };

      const originalSetValue = deps.customPropertiesRepository.setDocumentCustomPropertyValue;
      deps.customPropertiesRepository.setDocumentCustomPropertyValue = async (args) => {
        if (args.expectedAbsent) {
          await originalSetValue({
            documentId: args.documentId,
            propertyDefinitionId: args.propertyDefinitionId,
            values: [{ textValue: 'User vendor' }],
          });
        }

        return originalSetValue(args);
      };

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(generateStructuredData).toHaveBeenCalledOnce();

      const [document] = await deps.db.select().from(documentsTable);
      expect(document).toMatchObject({
        name: 'User renamed.pdf',
        originalName: 'scan.pdf',
        documentDate: new Date('2023-01-01T00:00:00.000Z'),
      });

      const customPropertyValues = await deps.db.select().from(documentCustomPropertyValuesTable);
      expect(customPropertyValues).toMatchObject([
        {
          propertyDefinitionId: 'cpd_vendor',
          textValue: 'User vendor',
        },
      ]);
    });

    test('still applies the document date when only the name changes after the reread', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          documentDate: '2024-03-12',
          filename: 'AI Invoice',
        },
      });

      const originalUpdateDocument = deps.documentsRepository.updateDocument;
      deps.documentsRepository.updateDocument = async (args) => {
        if (args.expectedName !== undefined) {
          await originalUpdateDocument({
            documentId: args.documentId,
            organizationId: args.organizationId,
            name: 'User renamed.pdf',
          });
        }

        return originalUpdateDocument(args);
      };

      await extractDocumentMetadata({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          extractCustomProperties: false,
        }),
      });

      expect(generateStructuredData).toHaveBeenCalledOnce();

      const [document] = await deps.db.select().from(documentsTable);
      expect(document).toMatchObject({
        name: 'User renamed.pdf',
        originalName: 'scan.pdf',
        documentDate: new Date('2024-03-12T00:00:00.000Z'),
      });
    });

    test('rethrows unexpected custom property write failures after applying the rest', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        customPropertyDefinitions: [
          {
            id: 'cpd_vendor',
            organizationId: 'org_1',
            name: 'Vendor',
            key: 'vendor',
            type: 'text',
          },
          {
            id: 'cpd_amount',
            organizationId: 'org_1',
            name: 'Amount',
            key: 'amount',
            type: 'number',
          },
        ],
      });
      const { aiServices } = createTestAiServices({
        response: {
          documentDate: '2024-03-12',
          customProperties: {
            vendor: 'Acme Corp',
            amount: 42.5,
          },
        },
      });

      const originalSetValue = deps.customPropertiesRepository.setDocumentCustomPropertyValue;
      deps.customPropertiesRepository.setDocumentCustomPropertyValue = async (args) => {
        if (args.propertyDefinitionId === 'cpd_amount') {
          throw new Error('db write failed');
        }

        return originalSetValue(args);
      };

      await expect(
        extractDocumentMetadata({
          ...deps,
          aiServices,
          logger,
          documentId: 'doc_1',
          organizationId: 'org_1',
          resolveOrganizationSettings: createTestResolveOrganizationSettings({
            extractDate: false,
            renameDocuments: false,
          }),
        }),
      ).rejects.toThrow(AggregateError);

      const customPropertyValues = await deps.db.select().from(documentCustomPropertyValuesTable);
      expect(customPropertyValues).toMatchObject([
        {
          propertyDefinitionId: 'cpd_vendor',
          textValue: 'Acme Corp',
        },
      ]);
    });
  });
});
