import { describe, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import type { AiServices } from '../ai/ai.services';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import type { AutoTaggingResponse } from '../auto-tagging/auto-tagging.models';
import { buildApplyAutoTaggingActions } from '../auto-tagging/auto-tagging.usecases';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createDocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import { buildEnrichDocument } from './document-enrichment.usecases';
import { buildTagsEnrichmentCapability } from './enrichment-capabilities/tags/tags.enrichment-capability';

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
  { isAiEnabled = true, isAutoTaggingEnabled = true } = {},
) {
  const { db } = await createInMemoryDatabase(seedOptions);
  const config = overrideConfig({
    ai: { isEnabled: isAiEnabled },
    autoTagging: { isEnabled: isAutoTaggingEnabled },
  });
  const tagsRepository = createTagsRepository({ db });
  const eventServices = createTestEventServices();
  const { logger } = createTestLogger();

  return {
    db,
    documentsRepository: createDocumentsRepository({ db }),
    tagsRepository,
    logger,
    config,
    capabilityDefinitions: [
      buildTagsEnrichmentCapability({
        config,
        applyAutoTaggingActions: buildApplyAutoTaggingActions({
          createTag: async (args) => createTag({ ...args, config, tagsRepository }),
          applyTagsToDocuments: async (args) =>
            applyTagsToDocuments({ ...args, tagsRepository, eventServices, logger }),
        }),
      }),
    ],
  };
}

const baseDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'Doc 1',
  originalName: 'original.pdf',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'text/plain',
  content: 'Some document content',
};

const documentIds = { documentId: 'doc_1', organizationId: 'org_1' };

const seed = {
  organizations: [{ id: 'org_1', name: 'Org 1' }],
  documents: [baseDocument],
  tags: [
    {
      id: 'tag_1',
      name: 'Finance',
      description: 'Financial documents',
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
};

describe('document enrichment', () => {
  test('when AI is disabled on the instance, the document is not tagged and the AI is not called', async () => {
    const deps = await createTestDeps(seed, { isAiEnabled: false });
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { existingTags: ['Finance'] },
    });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings(),
    });

    await enrichDocument(documentIds);

    expect(generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
  });

  test('when auto-tagging is disabled on the instance, the document is not tagged and the AI is not called', async () => {
    const deps = await createTestDeps(seed, { isAutoTaggingEnabled: false });
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { existingTags: ['Finance'] },
    });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings(),
    });

    await enrichDocument(documentIds);

    expect(generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
  });

  test('a missing document fails before analysis', async () => {
    const deps = await createTestDeps({ organizations: seed.organizations, tags: seed.tags });
    const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings(),
    });

    await expect(enrichDocument(documentIds)).rejects.toEqual(createDocumentNotFoundError());
    expect(generateStructuredData).not.toHaveBeenCalled();
  });

  test('when auto-tagging is disabled in the organization settings, the document is not tagged and the AI is not called', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { existingTags: ['Finance'] },
    });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({ isEnabled: false }),
    });

    await enrichDocument(documentIds);

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
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        isEnabled: true,
        canCreateNewTags: false,
      }),
    });

    await enrichDocument(documentIds);

    expect(generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
  });

  test('when the AI selects existing tags, they are applied to the document', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { existingTags: ['Finance'] },
    });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings(),
    });

    await enrichDocument(documentIds);

    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId: 'doc_1', tagId: 'tag_1' },
    ]);
    expect(generateStructuredData).toHaveBeenCalledTimes(1);
    const [request] = generateStructuredData.mock.calls[0]!;
    expect(request).toMatchObject({
      organizationId: 'org_1',
      modelId: 'gpt-4',
      source: 'document-enrichment',
    });
    const { tags } = await deps.tagsRepository.getOrganizationTags(documentIds);
    expect(JSON.parse(request.userPrompt)).toEqual({
      document: { name: baseDocument.originalName, content: baseDocument.content },
      existingTags: tags.map(({ name, description }) => ({ name, description })),
    });
    expect(request.systemPrompt).toMatchInlineSnapshot(`
      "You enrich documents for an archiving application.

      Given extracted document text, an original filename, return:

      DOCUMENT TAGS

      - Suggest tags that are relevant to the document content.
      - Select at most 5 tags.
      - You may only suggest existing tags.
      - If no relevant tags can be found, return an empty list."
    `);
    expect(v.parse(request.schema!, { existingTags: ['Finance'] })).toEqual({
      existingTags: ['Finance'],
    });
    expect(v.safeParse(request.schema!, { existingTags: ['Unknown'] }).success).toEqual(false);
  });

  test('existing and new tag suggestions respect the organization limit and prefer existing tags', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: {
        existingTags: ['Finance', 'Finance', 'Unknown'],
        newTags: [{ name: 'Invoice', description: 'Invoices and receipts' }, { name: 'Other' }],
      },
    });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        canCreateNewTags: true,
        maxTags: 2,
      }),
    });

    await enrichDocument(documentIds);

    const tags = await deps.db.select().from(tagsTable);
    expect(tags.map(({ name }) => name).sort()).toEqual(['Finance', 'Household', 'Invoice']);
    const invoiceTag = tags.find(({ name }) => name === 'Invoice')!;
    expect(invoiceTag.description).toEqual('Invoices and receipts');
    const documentTags = await deps.db.select().from(documentsTagsTable);
    expect(documentTags.map(({ tagId }) => tagId).sort()).toEqual(['tag_1', invoiceTag.id].sort());
    const [request] = generateStructuredData.mock.calls[0]!;
    expect(request.systemPrompt).toMatchInlineSnapshot(`
      "You enrich documents for an archiving application.

      Given extracted document text, an original filename, return:

      DOCUMENT TAGS

      - Suggest tags that are relevant to the document content.
      - Select at most 2 tags.
      - You may suggest new tags that do not exist yet.
      - If you suggest new tags, provide an optional description for each new tag.
      - Do not suggest new tags that are too similar to existing tags."
    `);
    const response = { existingTags: ['Finance'], newTags: [{ name: 'Invoice' }] };
    expect(v.parse(request.schema!, response)).toEqual(response);
    expect(
      v.safeParse(request.schema!, { existingTags: ['Unknown'], newTags: [] }).success,
    ).toEqual(false);
  });

  test('when the AI proposes new tags, they are created and applied to the document', async () => {
    const deps = await createTestDeps({
      organizations: seed.organizations,
      documents: seed.documents,
    });
    const response = { newTags: [{ name: 'Invoice', description: 'Invoices and receipts' }] };
    const { aiServices, generateStructuredData } = createTestAiServices({ response });
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        canCreateNewTags: true,
      }),
    });

    await enrichDocument(documentIds);

    const [request] = generateStructuredData.mock.calls[0]!;
    expect(v.parse(request.schema!, response)).toEqual(response);
    expect(JSON.parse(request.userPrompt)).toMatchObject({ existingTags: [] });
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

  test('an inference failure is propagated without applying tags', async () => {
    const deps = await createTestDeps(seed);
    const error = new Error('Inference failed');
    const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
    generateStructuredData.mockRejectedValue(error);
    const applyAutoTaggingActions = vi.fn<ReturnType<typeof buildApplyAutoTaggingActions>>();
    const enrichDocument = buildEnrichDocument({
      ...deps,
      aiServices,
      capabilityDefinitions: [
        buildTagsEnrichmentCapability({ config: deps.config, applyAutoTaggingActions }),
      ],
      resolveOrganizationSettings: createTestResolveOrganizationSettings(),
    });

    await expect(enrichDocument(documentIds)).rejects.toEqual(error);
    expect(applyAutoTaggingActions).not.toHaveBeenCalled();
  });
});
