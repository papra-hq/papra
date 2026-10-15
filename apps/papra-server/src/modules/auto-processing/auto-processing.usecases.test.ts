import { describe, expect, test, vi } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import type { AiServices } from '../ai/ai.services';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { autoProcessDocument } from './auto-processing.usecases';
import type { AutoProcessingResponse } from './auto-processing.models';

function createTestResolveOrganizationSettings({
  autoTagging = {},
  autoNaming = {},
}: {
  autoTagging?: Partial<{ isEnabled: boolean; canCreateNewTags: boolean; maxTags: number }>;
  autoNaming?: Partial<{ isEnabled: boolean }>;
} = {}): ResolveOrganizationSettingsUsecase {
  return async () => ({
    organizationSettings: {
      ai: {
        autoTagging: {
          isEnabled: true,
          canCreateNewTags: false,
          maxTags: 5,
          modelId: 'openai://gpt-4o-mini',
          ...autoTagging,
        },
        autoNaming: {
          isEnabled: false,
          ...autoNaming,
        },
      },
    },
  });
}

function createTestAiServices({ response }: { response: AutoProcessingResponse }) {
  const generateStructuredData = vi.fn().mockResolvedValue(response);

  return {
    aiServices: { generateStructuredData } as AiServices,
    generateStructuredData,
  };
}

async function createTestDeps(
  seedOptions: Parameters<typeof createInMemoryDatabase>[0],
  configOverrides: Parameters<typeof overrideConfig>[0] = {},
) {
  const { db } = await createInMemoryDatabase(seedOptions);

  return {
    db,
    documentsRepository: createDocumentsRepository({ db }),
    tagsRepository: createTagsRepository({ db }),
    eventServices: createTestEventServices(),
    config: overrideConfig({ autoNaming: { maxTitleLength: 120 }, ...configOverrides }),
  };
}

const baseDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'scan.pdf',
  originalName: 'scan.pdf',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'text/plain',
  content: 'Invoice from Acme Corp for March 2026',
};

const financeTag = {
  id: 'tag_1',
  name: 'Finance',
  normalizedName: 'finance',
  color: '#000000',
  organizationId: 'org_1',
};

describe('auto-processing usecases', () => {
  describe('autoProcessDocument', () => {
    test('when both auto-tagging and auto-naming are disabled in the organization settings, the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        tags: [financeTag],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: ['Finance'], title: 'Invoice' },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoTagging: { isEnabled: false },
          autoNaming: { isEnabled: false },
        }),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
      expect(await deps.db.select().from(documentsTagsTable)).to.eql([]);
    });

    test('when the organization has no existing tags, cannot create new ones and naming is disabled, the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: [] },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoTagging: { isEnabled: true, canCreateNewTags: false },
        }),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
    });

    test('when the features are enabled for the organization but disabled at the instance level, the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps(
        {
          organizations: [{ id: 'org_1', name: 'Org 1' }],
          documents: [baseDocument],
          tags: [financeTag],
        },
        { autoTagging: { isEnabled: false }, autoNaming: { isEnabled: false } },
      );
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: ['Finance'], title: 'Invoice' },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoNaming: { isEnabled: true },
        }),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
    });

    test('when the document is deleted, it is not processed and the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ ...baseDocument, isDeleted: true, deletedAt: new Date('2026-01-01') }],
        tags: [financeTag],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: ['Finance'], title: 'Invoice' },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoNaming: { isEnabled: true },
        }),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
      expect(await deps.db.select().from(documentsTagsTable)).to.eql([]);
    });

    test('when the AI selects existing tags, they are applied to the document', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        tags: [
          financeTag,
          { ...financeTag, id: 'tag_2', name: 'Household', normalizedName: 'household' },
        ],
      });
      const { aiServices } = createTestAiServices({ response: { existingTags: ['Finance'] } });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(await deps.db.select().from(documentsTagsTable)).to.eql([
        { documentId: 'doc_1', tagId: 'tag_1' },
      ]);
    });

    test('when the AI proposes new tags, they are created and applied to the document', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices } = createTestAiServices({
        response: { newTags: [{ name: 'Invoice', description: 'Invoices and receipts' }] },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoTagging: { canCreateNewTags: true },
        }),
      });

      const createdTags = await deps.db.select().from(tagsTable);
      expect(createdTags.length).to.eql(1);
      expect(createdTags[0]).toMatchObject({
        name: 'Invoice',
        description: 'Invoices and receipts',
      });

      expect(await deps.db.select().from(documentsTagsTable)).to.eql([
        { documentId: 'doc_1', tagId: createdTags[0]!.id },
      ]);
    });

    test('when only auto-naming is enabled, the document is renamed and a document.updated event is emitted', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        tags: [financeTag],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { title: 'Invoice - Acme Corp - March 2026' },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoTagging: { isEnabled: false },
          autoNaming: { isEnabled: true },
        }),
      });

      const { document } = await deps.documentsRepository.getDocumentById({
        documentId: 'doc_1',
        organizationId: 'org_1',
      });

      expect(generateStructuredData).toHaveBeenCalledTimes(1);
      expect(generateStructuredData.mock.calls[0]![0].systemPrompt).not.toContain('## Tags');
      expect(document?.name).to.eql('Invoice - Acme Corp - March 2026.pdf');
      expect(document?.originalName).to.eql('scan.pdf');
      expect(await deps.db.select().from(documentsTagsTable)).to.eql([]);
      expect(deps.eventServices.getEmittedEvents()).toMatchObject([
        {
          eventName: 'document.updated',
          payload: {
            userId: undefined,
            changes: { name: 'Invoice - Acme Corp - March 2026.pdf' },
            document: { id: 'doc_1', name: 'Invoice - Acme Corp - March 2026.pdf' },
          },
        },
      ]);
    });

    test('when both auto-tagging and auto-naming are enabled, a single AI request is made and both the title and tags are applied', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        tags: [financeTag],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { title: 'Invoice - Acme Corp - March 2026', existingTags: ['Finance'] },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoNaming: { isEnabled: true },
        }),
      });

      const { document } = await deps.documentsRepository.getDocumentById({
        documentId: 'doc_1',
        organizationId: 'org_1',
      });

      expect(generateStructuredData).toHaveBeenCalledTimes(1);
      expect(generateStructuredData).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'openai://gpt-4o-mini',
          organizationId: 'org_1',
          source: 'auto-processing',
          userPrompt: [
            '<document_name>',
            'scan.pdf',
            '</document_name>',
            '<document_content>',
            'Invoice from Acme Corp for March 2026',
            '</document_content>',
          ].join('\n'),
        }),
      );
      expect(document?.name).to.eql('Invoice - Acme Corp - March 2026.pdf');
      expect(await deps.db.select().from(documentsTagsTable)).to.eql([
        { documentId: 'doc_1', tagId: 'tag_1' },
      ]);
    });

    test('when the document is renamed by the user during the AI call, the user rename is not overwritten but tags are still applied', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        tags: [financeTag],
      });

      const generateStructuredData = vi.fn().mockImplementation(async () => {
        // Simulate a concurrent user rename while the AI call is in flight
        await deps.documentsRepository.updateDocument({
          documentId: 'doc_1',
          organizationId: 'org_1',
          name: 'User chosen name',
        });

        return { title: 'Invoice - Acme Corp - March 2026', existingTags: ['Finance'] };
      });

      await autoProcessDocument({
        ...deps,
        aiServices: { generateStructuredData } as unknown as AiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoNaming: { isEnabled: true },
        }),
      });

      const { document } = await deps.documentsRepository.getDocumentById({
        documentId: 'doc_1',
        organizationId: 'org_1',
      });

      expect(document?.name).to.eql('User chosen name');
      expect(
        deps.eventServices
          .getEmittedEvents()
          .filter(({ eventName }) => eventName === 'document.updated'),
      ).to.eql([]);
      expect(await deps.db.select().from(documentsTagsTable)).to.eql([
        { documentId: 'doc_1', tagId: 'tag_1' },
      ]);
    });

    test('when the generated title matches the current name, the document is not updated', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ ...baseDocument, name: 'Invoice - Acme Corp.pdf' }],
      });
      const { aiServices } = createTestAiServices({
        response: { title: 'Invoice - Acme Corp' },
      });

      await autoProcessDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          autoTagging: { isEnabled: false },
          autoNaming: { isEnabled: true },
        }),
      });

      expect(deps.eventServices.getEmittedEvents()).to.eql([]);
    });
  });
});
