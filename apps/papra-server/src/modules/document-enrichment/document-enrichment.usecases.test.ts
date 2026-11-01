import { describe, expect, test, vi } from 'vitest';
import { DEFAULT_TAGGING_PROMPT } from './enrichment-capabilities/tags/tags.models';
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
import { documentsTable } from '../documents/documents.table';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import { buildFilenameEnrichmentCapability } from './enrichment-capabilities/filename/filename.enrichment-capability';
import {
  buildEnrichDocument,
  buildScheduleDocumentEnrichment,
} from './document-enrichment.usecases';
import { buildTagsEnrichmentCapability } from './enrichment-capabilities/tags/tags.enrichment-capability';

function createTestResolveOrganizationSettings(
  autoTagging: Partial<{
    isEnabled: boolean;
    canCreateNewTags: boolean;
    maxTags: number;
    namingEnabled: boolean;
    separateNamingRequest: boolean;
    filenamePrompt: string;
    taggingPrompt: string;
  }> = {},
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

function createTestAiServices({
  response,
}: {
  response: AutoTaggingResponse & { filename?: string };
}) {
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
  const documentsRepository = createDocumentsRepository({ db });
  const { logger } = createTestLogger();

  return {
    db,
    documentsRepository,
    eventServices,
    tagsRepository,
    logger,
    config,
    capabilityDefinitions: [
      buildFilenameEnrichmentCapability({ config, documentsRepository, eventServices }),
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
        existingTags: ['Finance', 'Finance'],
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

describe('filename enrichment', () => {
  test('one inference applies tags and a safe filename and sends only the original extension', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: {
        existingTags: ['Finance'],
        filename: '2000-01-02_Example_Invoice.pdf.pdf',
      },
    });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({ namingEnabled: true }),
    })(documentIds);
    expect(generateStructuredData).toHaveBeenCalledTimes(1);
    const [request] = generateStructuredData.mock.calls[0]!;
    expect(JSON.parse(request.userPrompt)).toMatchObject({
      document: { extension: '.pdf', content: baseDocument.content },
    });
    expect(request.userPrompt).not.toContain(baseDocument.originalName);
    expect((await deps.documentsRepository.getDocumentById(documentIds)).document?.name).toBe(
      '2000-01-02_Example_Invoice.pdf',
    );
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId: 'doc_1', tagId: 'tag_1' },
    ]);
    expect(deps.eventServices.getEmittedEvents()).toContainEqual(
      expect.objectContaining({
        eventName: 'document.updated',
        payload: expect.objectContaining({ changes: { name: '2000-01-02_Example_Invoice.pdf' } }),
      }),
    );
  });

  test('naming works without tags and with automatic tagging disabled', async () => {
    const deps = await createTestDeps({
      organizations: seed.organizations,
      documents: seed.documents,
    });
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { filename: 'Notice.pdf' },
    });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        namingEnabled: true,
        isEnabled: false,
      }),
    })(documentIds);
    expect(generateStructuredData).toHaveBeenCalledTimes(1);
    expect((await deps.documentsRepository.getDocumentById(documentIds)).document?.name).toBe(
      'Notice.pdf',
    );
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
  });

  test.each(['name', 'content', 'deleted'] as const)(
    'a concurrent %s change prevents renaming',
    async (change) => {
      const deps = await createTestDeps(seed);
      const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
      generateStructuredData.mockImplementationOnce(async () => {
        if (change === 'deleted') await deps.db.update(documentsTable).set({ isDeleted: true });
        else
          await deps.documentsRepository.updateDocument({
            ...documentIds,
            [change]: 'Manual edit',
          });
        return { filename: 'AI.pdf' };
      });
      await buildEnrichDocument({
        ...deps,
        aiServices,
        resolveOrganizationSettings: createTestResolveOrganizationSettings({ namingEnabled: true }),
      })({ ...documentIds, capabilities: ['filename'] });
      const { document } = await deps.documentsRepository.getDocumentById(documentIds);
      expect(document?.name).toBe(change === 'name' ? 'Manual edit' : baseDocument.name);
      expect(
        deps.eventServices.getEmittedEvents().filter((e) => e.eventName === 'document.updated'),
      ).toEqual([]);
    },
  );

  test.each([
    { existingTags: ['Finance'] },
    { existingTags: ['Invented'], filename: 'Notice.pdf' },
    { existingTags: ['Finance'], filename: '' },
  ])('invalid combined responses do not change tags or filename: %j', async (response) => {
    const deps = await createTestDeps(seed);
    const { aiServices } = createTestAiServices({ response });
    const enrich = buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({ namingEnabled: true }),
    });
    await expect(enrich(documentIds)).rejects.toThrow();
    expect((await deps.documentsRepository.getDocumentById(documentIds)).document?.name).toBe(
      baseDocument.name,
    );
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
  });

  test('empty extracted text does not consume an inference or rename the document', async () => {
    const deps = await createTestDeps({ ...seed, documents: [{ ...baseDocument, content: '  ' }] });
    const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({ namingEnabled: true }),
    })(documentIds);
    expect(generateStructuredData).not.toHaveBeenCalled();
    expect((await deps.documentsRepository.getDocumentById(documentIds)).document?.name).toBe(
      baseDocument.name,
    );
  });

  test('organization instructions are included with the generated schema', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { filename: 'Notice.pdf' },
    });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        namingEnabled: true,
        filenamePrompt: 'Use concise subjects.',
      }),
    })({ ...documentIds, capabilities: ['filename'] });
    const [request] = generateStructuredData.mock.calls[0]!;
    expect(request.systemPrompt).toContain('Use concise subjects.');
    expect(v.parse(request.schema!, { filename: 'Notice.pdf' })).toEqual({
      filename: 'Notice.pdf',
    });
  });

  test('the enrichment API rejects naming requests when naming is disabled', async () => {
    const deps = await createTestDeps(seed);
    const scheduleJob = vi.fn();
    const schedule = buildScheduleDocumentEnrichment({
      ...deps,
      taskServices: { scheduleJob },
      resolveOrganizationSettings: createTestResolveOrganizationSettings({ namingEnabled: false }),
    });
    await expect(schedule({ ...documentIds, capabilities: ['filename'] })).rejects.toMatchObject({
      code: 'document_enrichment.disabled',
    });
    expect(scheduleJob).not.toHaveBeenCalled();
  });
});

describe('separate naming requests', () => {
  test('uses isolated prompts and schemas, with sequential requests applying both results', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
    let active = false;
    generateStructuredData.mockImplementation(async ({ userPrompt, systemPrompt, schema }) => {
      expect(active).toBe(false);
      active = true;
      await new Promise((resolve) => setTimeout(resolve, 1));
      const input = JSON.parse(userPrompt);
      const naming = userPrompt.includes('"extension":');
      if (naming) {
        expect(input).not.toHaveProperty('existingTags');
        expect(systemPrompt).not.toContain('DOCUMENT TAGS');
        expect(systemPrompt).not.toContain('Use short category labels.');
        expect(systemPrompt).toContain('Use concise subjects.');
        expect(v.safeParse(schema!, { existingTags: [] }).success).toBe(false);
      } else {
        expect(input).toHaveProperty('existingTags');
        expect(systemPrompt).toContain('DOCUMENT TAGS');
        expect(systemPrompt).toContain('Use short category labels.');
        expect(systemPrompt).not.toContain('Use concise subjects.');
        expect(v.safeParse(schema!, { filename: 'Example.pdf' }).success).toBe(false);
      }
      active = false;
      return naming ? { filename: 'Example.pdf' } : { existingTags: ['Finance'] };
    });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        namingEnabled: true,
        separateNamingRequest: true,
        filenamePrompt: 'Use concise subjects.',
        taggingPrompt: 'Use short category labels.',
      }),
    })(documentIds);
    expect(generateStructuredData).toHaveBeenCalledTimes(2);
    expect((await deps.documentsRepository.getDocumentById(documentIds)).document?.name).toBe(
      'Example.pdf',
    );
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId: 'doc_1', tagId: 'tag_1' },
    ]);
  });

  test.each(['filename', 'auto-tagging'] as const)(
    'a failed %s request does not prevent the other result',
    async (failedCapability) => {
      const deps = await createTestDeps(seed);
      const { aiServices, generateStructuredData } = createTestAiServices({ response: {} });
      generateStructuredData.mockImplementation(async ({ userPrompt }) => {
        const naming = userPrompt.includes('"extension":');
        if (naming === (failedCapability === 'filename'))
          throw new Error('Synthetic provider failure');
        return naming ? { filename: 'Example.pdf' } : { existingTags: ['Finance'] };
      });
      await expect(
        buildEnrichDocument({
          ...deps,
          aiServices,
          resolveOrganizationSettings: createTestResolveOrganizationSettings({
            namingEnabled: true,
            separateNamingRequest: true,
          }),
        })(documentIds),
      ).rejects.toThrow('One or more separate enrichment requests failed.');
      expect(generateStructuredData).toHaveBeenCalledTimes(2);
      expect((await deps.documentsRepository.getDocumentById(documentIds)).document?.name).toBe(
        failedCapability === 'filename' ? baseDocument.name : 'Example.pdf',
      );
      expect(await deps.db.select().from(documentsTagsTable)).toHaveLength(
        failedCapability === 'filename' ? 1 : 0,
      );
    },
  );

  test('an explicit naming-only request still calls the model once', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { filename: 'Example.pdf' },
    });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        namingEnabled: true,
        separateNamingRequest: true,
      }),
    })({ ...documentIds, capabilities: ['filename'] });
    expect(generateStructuredData).toHaveBeenCalledTimes(1);
    expect(await deps.db.select().from(documentsTagsTable)).toHaveLength(0);
  });
});

describe('editable tagging prompt', () => {
  test.each([false, true])(
    'saving or clearing default instructions preserves the exact prompt (new tags: %s)',
    async (canCreateNewTags) => {
      const deps = await createTestDeps(seed);
      const prompts: string[] = [];
      for (const taggingPrompt of [undefined, DEFAULT_TAGGING_PROMPT, '', '   ']) {
        const { aiServices, generateStructuredData } = createTestAiServices({
          response: canCreateNewTags ? { existingTags: [], newTags: [] } : { existingTags: [] },
        });
        await buildEnrichDocument({
          ...deps,
          aiServices,
          resolveOrganizationSettings: createTestResolveOrganizationSettings({
            canCreateNewTags,
            taggingPrompt,
          }),
        })({ ...documentIds, capabilities: ['auto-tagging'] });
        prompts.push(generateStructuredData.mock.calls[0]![0].systemPrompt!);
      }
      expect(new Set(prompts).size).toBe(1);
    },
  );

  test('custom guidance retains the configured limits and existing-tag-only schema', async () => {
    const deps = await createTestDeps(seed);
    const { aiServices, generateStructuredData } = createTestAiServices({
      response: { existingTags: ['Finance'] },
    });
    await buildEnrichDocument({
      ...deps,
      aiServices,
      resolveOrganizationSettings: createTestResolveOrganizationSettings({
        maxTags: 2,
        canCreateNewTags: false,
        taggingPrompt: 'Use short category labels.',
      }),
    })({ ...documentIds, capabilities: ['auto-tagging'] });
    const request = generateStructuredData.mock.calls[0]![0];
    expect(request.systemPrompt).toContain('Use short category labels.');
    expect(request.systemPrompt).toContain('- Select at most 2 tags.');
    expect(request.systemPrompt).toContain('- You may only suggest existing tags.');
    expect(request.systemPrompt).not.toContain(
      '- Suggest tags that are relevant to the document content.',
    );
    expect(v.safeParse(request.schema!, { existingTags: ['Invented'] }).success).toBe(false);
  });
});
