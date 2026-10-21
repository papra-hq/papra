import { describe, expect, test, vi } from 'vitest';
import type { AiServices } from '../../ai/ai.services';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createTestEventServices } from '../../app/events/events.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { createDocumentNotFoundError } from '../../documents/documents.errors';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { registerExtractDocumentFileContentTask } from '../../documents/tasks/extract-document-file-content.task';
import { createOrganizationSettingsRepository } from '../../organizations/organization-settings/organization-settings.repository';
import { createReadableStream } from '../../shared/streams/readable-stream';
import { createInMemoryStorageService } from '../../storage/storage.test-utils';
import { documentsTagsTable } from '../../tags/tags.table';
import { createInMemoryTaskServices } from '../../tasks/tasks.test-utils';
import { registerEnrichDocumentTask } from './enrich-document.task';

const documentIds = { documentId: 'doc_1', organizationId: 'org_1' };
const context = { workerId: 'test' };

async function createTestDeps({ aiEnabled = true, autoTaggingEnabled = true } = {}) {
  const { db } = await createInMemoryDatabase({
    organizations: [{ id: 'org_1', name: 'Org 1' }],
    documents: [
      {
        id: 'doc_1',
        organizationId: 'org_1',
        name: 'invoice.txt',
        originalName: 'invoice.txt',
        originalStorageKey: 'doc_1',
        originalSha256Hash: 'doc_1',
        mimeType: 'text/plain',
      },
    ],
    tags: [
      {
        id: 'tag_1',
        organizationId: 'org_1',
        name: 'Finance',
        normalizedName: 'finance',
        color: '#000000',
      },
    ],
  });
  const config = overrideConfig({
    ai: { isEnabled: aiEnabled },
    autoTagging: { isEnabled: autoTaggingEnabled, modelId: 'openai://test-model' },
    documentContentExtraction: { extractionStrategies: ['internal'] },
  });
  const taskServices = createInMemoryTaskServices();
  const documentsStorageService = createInMemoryStorageService();
  const eventServices = createTestEventServices();
  const generateStructuredData = vi
    .fn<AiServices['generateStructuredData']>()
    .mockResolvedValue({ existingTags: ['Finance'] });
  const aiServices = { generateStructuredData } as AiServices;

  await documentsStorageService.saveFile({
    storageKey: 'doc_1',
    fileStream: createReadableStream({ content: 'Invoice for office supplies' }),
    fileName: 'invoice.txt',
    mimeType: 'text/plain',
  });

  await registerEnrichDocumentTask({ db, config, taskServices, eventServices, aiServices });
  await registerExtractDocumentFileContentTask({
    db,
    config,
    taskServices,
    eventServices,
    documentsStorageService,
  });

  const taskRegistry = taskServices.getTaskRegistry();
  const { taskDefinition: extractTask } = taskRegistry.getTaskOrThrow({
    taskName: 'extract-document-file-content',
  });

  return {
    db,
    taskServices,
    taskRegistry,
    generateStructuredData,
    documentsRepository: createDocumentsRepository({ db }),
    organizationSettingsRepository: createOrganizationSettingsRepository({ db }),
    extractDocumentContent: async () =>
      extractTask.handler({ data: { ...documentIds, ocrLanguages: ['eng'] }, context }),
  };
}

describe('document enrichment task', () => {
  test('text extraction schedules enrichment, which tags the document using its extracted content and existing settings', async () => {
    const deps = await createTestDeps();
    await deps.organizationSettingsRepository.createOrUpdateOrganizationSettings({
      organizationId: 'org_1',
      settings: { aiAutoTaggingEnabled: true },
    });

    await deps.extractDocumentContent();

    expect(await deps.taskServices.getJobCount()).toEqual({ count: 1 });
    expect(deps.generateStructuredData).not.toHaveBeenCalled();
    const { job } = await deps.taskServices.getDriver().getNextJobAndMarkAsProcessing({
      abortSignal: AbortSignal.timeout(1_000),
    });
    expect(job).toMatchObject({ taskName: 'enrich-document', data: documentIds });
    expect(deps.taskRegistry.getTask({ taskName: 'auto-tag-document' }).taskDefinition).toEqual(
      undefined,
    );

    const { taskDefinition } = deps.taskRegistry.getTaskOrThrow({ taskName: job.taskName });
    await taskDefinition.handler({ data: job.data, context });

    expect(deps.generateStructuredData).toHaveBeenCalledTimes(1);
    const [request] = deps.generateStructuredData.mock.calls[0]!;
    expect(request).toMatchObject({
      organizationId: 'org_1',
      modelId: 'openai://test-model',
      source: 'auto-tagging',
    });
    expect(request.userPrompt).toContain('Invoice for office supplies');
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId: 'doc_1', tagId: 'tag_1' },
    ]);
  });

  test('enrichment keeps automatic tagging disabled for organizations without settings', async () => {
    const deps = await createTestDeps();
    const { taskDefinition } = deps.taskRegistry.getTaskOrThrow({ taskName: 'enrich-document' });

    await taskDefinition.handler({ data: documentIds, context });

    expect(deps.generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([]);
  });

  test('disabling AI prevents enrichment registration and scheduling without preventing text extraction', async () => {
    const deps = await createTestDeps({ aiEnabled: false });

    await deps.extractDocumentContent();

    expect(deps.taskRegistry.getTask({ taskName: 'enrich-document' }).taskDefinition).toEqual(
      undefined,
    );
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
    expect(await deps.documentsRepository.getDocumentById(documentIds)).toMatchObject({
      document: { content: 'Invoice for office supplies' },
    });
  });

  test('disabling global auto-tagging prevents enrichment registration and scheduling without preventing text extraction', async () => {
    const deps = await createTestDeps({ autoTaggingEnabled: false });

    await deps.extractDocumentContent();

    expect(deps.taskRegistry.getTask({ taskName: 'enrich-document' }).taskDefinition).toEqual(
      undefined,
    );
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
    expect(await deps.documentsRepository.getDocumentById(documentIds)).toMatchObject({
      document: { content: 'Invoice for office supplies' },
    });
  });

  test('a failed extraction does not schedule enrichment', async () => {
    const deps = await createTestDeps();
    const { taskDefinition } = deps.taskRegistry.getTaskOrThrow({
      taskName: 'extract-document-file-content',
    });

    await expect(
      taskDefinition.handler({
        data: { ...documentIds, documentId: 'missing', ocrLanguages: ['eng'] },
        context,
      }),
    ).rejects.toEqual(createDocumentNotFoundError());

    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
    expect(deps.generateStructuredData).not.toHaveBeenCalled();
  });
});
