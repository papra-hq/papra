import { describe, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import type { AiServices } from '../ai/ai.services';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createDocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import {
  buildApplyAutoTaggingActions,
  buildAutoTagDocument,
  buildPromptForAutoTagging,
} from './auto-tagging.usecases';
import type { AutoTaggingResponse } from './auto-tagging.models';
import { buildAutoTaggingSystemPrompt, buildAutoTaggingUserPrompt } from './auto-tagging.models';

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
  const generateStructuredData = vi
    .fn<AiServices['generateStructuredData']>()
    .mockResolvedValue(response);

  return {
    aiServices: { generateStructuredData } as AiServices,
    generateStructuredData,
  };
}

async function createTestDeps(
  seedOptions: Parameters<typeof createInMemoryDatabase>[0],
  config = overrideConfig(),
) {
  const { db } = await createInMemoryDatabase(seedOptions);
  const tagsRepository = createTagsRepository({ db });
  const eventServices = createTestEventServices();
  const { logger } = createTestLogger();

  return {
    db,
    documentsRepository: createDocumentsRepository({ db }),
    tagsRepository,
    eventServices,
    logger,
    applyAutoTaggingActions: buildApplyAutoTaggingActions({
      createTag: async (args) => createTag({ ...args, config, tagsRepository }),
      applyTagsToDocuments: async (args) =>
        applyTagsToDocuments({ ...args, tagsRepository, eventServices, logger }),
    }),
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

const financeTag = {
  id: 'tag_1',
  name: 'Finance',
  normalizedName: 'finance',
  color: '#000000',
  organizationId: 'org_1',
};

const householdTag = {
  id: 'tag_2',
  name: 'Household',
  normalizedName: 'household',
  color: '#000000',
  organizationId: 'org_1',
};

const documentIds = { documentId: 'doc_1', organizationId: 'org_1' };

const seed = {
  organizations: [{ id: 'org_1', name: 'Org 1' }],
  documents: [baseDocument],
  tags: [financeTag, householdTag],
};

describe('auto-tagging usecases', () => {
  describe('buildPromptForAutoTagging', () => {
    test('analysis uses the existing prompts and accounting source and returns bounded tag actions without applying them', async () => {
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: {
          existingTags: ['Finance', 'Finance', 'Unknown'],
          newTags: [{ name: 'Invoice', description: 'Invoices and receipts' }, { name: 'Other' }],
        },
      });
      const promptForAutoTagging = buildPromptForAutoTagging({ aiServices });
      const options = { existingTags: seed.tags, canCreateNewTags: true, maxTags: 2 };

      expect(
        await promptForAutoTagging({
          document: baseDocument,
          modelId: 'openai://gpt-4',
          ...options,
        }),
      ).toEqual({
        tagIdsToAdd: ['tag_1'],
        tagsToCreate: [{ name: 'Invoice', description: 'Invoices and receipts' }],
      });
      expect(generateStructuredData).toHaveBeenCalledTimes(1);
      const [request] = generateStructuredData.mock.calls[0]!;
      expect(request).toMatchObject({
        organizationId: 'org_1',
        modelId: 'openai://gpt-4',
        source: 'auto-tagging',
        systemPrompt: buildAutoTaggingSystemPrompt(options),
        userPrompt: buildAutoTaggingUserPrompt({ document: baseDocument }),
      });
      expect(
        v.safeParse(request.schema!, { existingTags: ['Finance'], newTags: [] }).success,
      ).toEqual(true);
      expect(
        v.safeParse(request.schema!, { existingTags: ['Unknown'], newTags: [] }).success,
      ).toEqual(false);
    });
  });

  describe('buildAutoTagDocument', () => {
    test('when auto-tagging is disabled in the organization settings, the document is not tagged and the AI is not called', async () => {
      const deps = await createTestDeps(seed);
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: ['Finance'] },
      });
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging: buildPromptForAutoTagging({ aiServices }),
        resolveOrganizationSettings: createTestResolveOrganizationSettings({ isEnabled: false }),
      });

      await autoTagDocument(documentIds);

      expect(generateStructuredData).not.toHaveBeenCalled();
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
    });

    test('when the organization has no existing tags and cannot create new ones, the document is not tagged and the AI is not called', async () => {
      const deps = await createTestDeps({
        organizations: seed.organizations,
        documents: seed.documents,
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { existingTags: [] },
      });
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging: buildPromptForAutoTagging({ aiServices }),
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          isEnabled: true,
          canCreateNewTags: false,
        }),
      });

      await autoTagDocument(documentIds);

      expect(generateStructuredData).not.toHaveBeenCalled();
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
    });

    test('when the AI selects existing tags, they are applied to the document', async () => {
      const deps = await createTestDeps(seed);
      const { aiServices } = createTestAiServices({ response: { existingTags: ['Finance'] } });
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging: buildPromptForAutoTagging({ aiServices }),
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      await autoTagDocument(documentIds);

      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: 'doc_1', tagId: 'tag_1' },
      ]);
    });

    test('when the AI proposes new tags, they are created and applied to the document', async () => {
      const deps = await createTestDeps({
        organizations: seed.organizations,
        documents: seed.documents,
      });
      const { aiServices } = createTestAiServices({
        response: { newTags: [{ name: 'Invoice', description: 'Invoices and receipts' }] },
      });
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging: buildPromptForAutoTagging({ aiServices }),
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          canCreateNewTags: true,
        }),
      });

      await autoTagDocument(documentIds);

      const createdTags = await deps.db.select().from(tagsTable);
      expect(createdTags.length).toEqual(1);
      expect(createdTags[0]).toMatchObject({
        name: 'Invoice',
        description: 'Invoices and receipts',
        color: '#CCCCCC',
        organizationId: 'org_1',
      });
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: 'doc_1', tagId: createdTags[0]!.id },
      ]);
    });

    test('the organization model and tag settings are passed to analysis and its actions are passed to application', async () => {
      const deps = await createTestDeps(seed);
      const actions = { tagIdsToAdd: ['tag_1'], tagsToCreate: [{ name: 'Invoice' }] };
      const promptForAutoTagging = vi
        .fn<ReturnType<typeof buildPromptForAutoTagging>>()
        .mockResolvedValue(actions);
      const applyAutoTaggingActions = vi
        .fn<ReturnType<typeof buildApplyAutoTaggingActions>>()
        .mockResolvedValue();
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging,
        applyAutoTaggingActions,
        resolveOrganizationSettings: createTestResolveOrganizationSettings({
          maxTags: 2,
          canCreateNewTags: true,
        }),
      });

      await autoTagDocument(documentIds);

      expect(promptForAutoTagging).toHaveBeenCalledTimes(1);
      const [request] = promptForAutoTagging.mock.calls[0]!;
      expect(request).toMatchObject({
        document: baseDocument,
        canCreateNewTags: true,
        maxTags: 2,
        modelId: 'gpt-4',
      });
      expect(request.existingTags.toSorted((a, b) => a.id.localeCompare(b.id))).toMatchObject(
        seed.tags,
      );
      expect(applyAutoTaggingActions).toHaveBeenCalledExactlyOnceWith({
        ...documentIds,
        ...actions,
      });
    });

    test('a missing document fails before analysis', async () => {
      const deps = await createTestDeps({ organizations: seed.organizations, tags: seed.tags });
      const promptForAutoTagging = vi.fn<ReturnType<typeof buildPromptForAutoTagging>>();
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging,
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      await expect(autoTagDocument(documentIds)).rejects.toEqual(createDocumentNotFoundError());
      expect(promptForAutoTagging).not.toHaveBeenCalled();
    });

    test('an inference failure is propagated without applying tags', async () => {
      const deps = await createTestDeps(seed);
      const error = new Error('Inference failed');
      const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
      generateStructuredData.mockRejectedValue(error);
      const applyAutoTaggingActions = vi.fn<ReturnType<typeof buildApplyAutoTaggingActions>>();
      const autoTagDocument = buildAutoTagDocument({
        ...deps,
        promptForAutoTagging: buildPromptForAutoTagging({ aiServices }),
        applyAutoTaggingActions,
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      await expect(autoTagDocument(documentIds)).rejects.toEqual(error);
      expect(applyAutoTaggingActions).not.toHaveBeenCalled();
    });
  });

  describe('buildApplyAutoTaggingActions', () => {
    test('existing and successfully created tags are applied despite a creation failure, preserving current tags and emitting the domain event', async () => {
      const deps = await createTestDeps(seed);
      await deps.db.insert(documentsTagsTable).values({ documentId: 'doc_1', tagId: 'tag_2' });

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: ['tag_1'],
        tagsToCreate: [
          { name: 'Finance' },
          { name: 'Invoice', description: 'Invoices and receipts' },
        ],
      });

      const tags = await deps.db.select().from(tagsTable);
      expect(tags.length).toEqual(3);
      const invoiceTag = tags.find((tag) => tag.name === 'Invoice')!;
      expect(invoiceTag).toMatchObject({
        description: 'Invoices and receipts',
        color: '#CCCCCC',
        organizationId: 'org_1',
      });
      const documentTags = await deps.db.select().from(documentsTagsTable);
      expect(documentTags.map(({ tagId }) => tagId).sort()).toEqual(
        ['tag_1', 'tag_2', invoiceTag.id].sort(),
      );
      expect(deps.eventServices.getEmittedEvents()).toEqual([
        {
          eventName: 'document.tags.changed',
          payload: {
            organizationId: 'org_1',
            userId: undefined,
            addedPairs: [
              { documentId: 'doc_1', tagId: 'tag_1', tagName: 'Finance' },
              { documentId: 'doc_1', tagId: invoiceTag.id, tagName: 'Invoice' },
            ],
            removedPairs: [],
          },
        },
      ]);
    });

    test('the organization tag limit prevents new tags without preventing existing tags from being applied', async () => {
      const deps = await createTestDeps(
        seed,
        overrideConfig({ tags: { maxTagsPerOrganization: 2 } }),
      );

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: ['tag_1'],
        tagsToCreate: [{ name: 'Invoice' }],
      });

      expect((await deps.db.select().from(tagsTable)).length).toEqual(2);
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: 'doc_1', tagId: 'tag_1' },
      ]);
    });

    test('empty actions leave existing tags untouched and emit no event', async () => {
      const deps = await createTestDeps(seed);
      await deps.db.insert(documentsTagsTable).values({ documentId: 'doc_1', tagId: 'tag_2' });

      await deps.applyAutoTaggingActions({ ...documentIds, tagIdsToAdd: [], tagsToCreate: [] });

      expect((await deps.db.select().from(tagsTable)).length).toEqual(2);
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: 'doc_1', tagId: 'tag_2' },
      ]);
      expect(deps.eventServices.getEmittedEvents()).toEqual([]);
    });
  });
});
