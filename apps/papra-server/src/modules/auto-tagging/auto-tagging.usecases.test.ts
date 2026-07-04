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
import { autoTagDocument } from './auto-tagging.usecases';
import type { AutoTaggingResponse } from './auto-tagging.models';

function createTestResolveOrganizationSettings(
  autoTagging: Partial<{ isEnabled: boolean; canCreateNewTags: boolean; maxTags: number }> = {},
): ResolveOrganizationSettingsUsecase {
  return async () => ({
    organizationSettings: {
      ai: {
        autoTagging: {
          isEnabled: true,
          canCreateNewTags: false,
          maxTags: 5,
          modelId: 'gpt-4',
          ...autoTagging,
        },
      },
    },
  });
}

function createTestAiServices({ response }: { response: AutoTaggingResponse }) {
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
    tagsRepository: createTagsRepository({ db }),
    eventServices: createTestEventServices(),
    config: overrideConfig(),
  };
}

const baseDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'Doc 1',
  originalName: 'Doc 1',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'text/plain',
  content: 'Some document content',
};

describe('auto-tagging usecases', () => {
  describe('autoTagDocument', () => {
    test('when auto-tagging is disabled in the organization settings, the document is not tagged and the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
        tags: [
          {
            id: 'tag_1',
            name: 'Finance',
            normalizedName: 'finance',
            color: '#000000',
            organizationId: 'org_1',
          },
        ],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: ['Finance'] },
      });

      await autoTagDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({ isEnabled: false }),
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
      expect(await deps.db.select().from(documentsTagsTable)).to.eql([]);
    });

    test('when the organization has no existing tags and cannot create new ones, the document is not tagged and the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: [] },
      });

      await autoTagDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          isEnabled: true,
          canCreateNewTags: false,
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
          {
            id: 'tag_1',
            name: 'Finance',
            normalizedName: 'finance',
            color: '#000000',
            organizationId: 'org_1',
          },
          {
            id: 'tag_2',
            name: 'Household',
            normalizedName: 'household',
            color: '#000000',
            organizationId: 'org_1',
          },
        ],
      });
      const { aiServices } = createTestAiServices({ response: { existingTags: ['Finance'] } });

      await autoTagDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          isEnabled: true,
          canCreateNewTags: false,
        }),
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

      await autoTagDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          isEnabled: true,
          canCreateNewTags: true,
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
  });
});
