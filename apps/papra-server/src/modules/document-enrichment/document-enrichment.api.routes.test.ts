import * as v from 'valibot';
import { describe, expect, test, vi } from 'vitest';
import type { AiServices } from '../ai/ai.services';
import { createApiKeysRepository } from '../api-keys/api-keys.repository';
import type { ApiKeyPermissions } from '../api-keys/api-keys.types';
import { createApiKey } from '../api-keys/api-keys.usecases';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import { createServer } from '../app/server';
import { createTestServerDependencies } from '../app/server.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createOrganizationSettingsRepository } from '../organizations/organization-settings/organization-settings.repository';
import { documentsTagsTable } from '../tags/tags.table';
import { enrichDocumentContract } from './document-enrichment.api.contracts';
import { registerEnrichDocumentTask } from './tasks/enrich-document.task';

const organizationId = 'org_111111111111111111111111';
const otherOrganizationId = 'org_222222222222222222222222';
const documentId = 'doc_111111111111111111111111';
const foreignDocumentId = 'doc_222222222222222222222222';
const documentIds = { documentId, organizationId };
const taskResponseSchema = enrichDocumentContract.responses[202].content['application/json'].schema;

async function createTestDeps({
  aiEnabled = true,
  autoTaggingEnabled = true,
  organizationAutoTaggingEnabled = true,
  content = 'Invoice for office supplies',
  isDeleted = false,
  permissions = ['documents:update'],
}: {
  aiEnabled?: boolean;
  autoTaggingEnabled?: boolean;
  organizationAutoTaggingEnabled?: boolean;
  content?: string;
  isDeleted?: boolean;
  permissions?: ApiKeyPermissions[];
} = {}) {
  const document = {
    id: documentId,
    organizationId,
    name: 'invoice.txt',
    originalName: 'invoice.txt',
    originalStorageKey: documentId,
    originalSha256Hash: documentId,
    mimeType: 'text/plain',
    content,
    isDeleted,
  };
  const { db } = await createInMemoryDatabase({
    users: [{ id: 'usr_alice', email: 'alice@example.com' }],
    organizations: [
      { id: organizationId, name: 'Org 1' },
      { id: otherOrganizationId, name: 'Org 2' },
    ],
    organizationMembers: [{ organizationId, userId: 'usr_alice', role: 'member' }],
    documents: [
      document,
      { ...document, id: foreignDocumentId, organizationId: otherOrganizationId },
    ],
    tags: [
      {
        id: 'tag_finance',
        organizationId,
        name: 'Finance',
        normalizedName: 'finance',
        color: '#000000',
      },
      {
        id: 'tag_manual',
        organizationId,
        name: 'Manual',
        normalizedName: 'manual',
        color: '#000000',
      },
    ],
    documentsTags: [{ documentId, tagId: 'tag_manual' }],
  });
  const config = overrideConfig({
    ai: { isEnabled: aiEnabled },
    autoTagging: { isEnabled: autoTaggingEnabled, modelId: 'openai://test-model' },
  });
  const generateStructuredData = vi
    .fn<AiServices['generateStructuredData']>()
    .mockResolvedValue({ existingTags: ['Finance'] });
  const dependencies = createTestServerDependencies({
    db,
    config,
    eventServices: createTestEventServices(),
    aiServices: { generateStructuredData } as AiServices,
  });
  await registerEnrichDocumentTask(dependencies);
  const { app } = createServer(dependencies);
  const organizationSettingsRepository = createOrganizationSettingsRepository({ db });
  await organizationSettingsRepository.createOrUpdateOrganizationSettings({
    organizationId,
    settings: { aiAutoTaggingEnabled: organizationAutoTaggingEnabled },
  });
  const { token } = await createApiKey({
    apiKeyRepository: createApiKeysRepository({ db }),
    name: 'Enrichment key',
    userId: 'usr_alice',
    permissions,
    allOrganizations: true,
    organizationIds: [],
  });
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  return {
    ...dependencies,
    generateStructuredData,
    organizationSettingsRepository,
    documentsRepository: createDocumentsRepository({ db }),
    request: async ({
      body = { capabilities: ['auto-tagging'] },
      requestHeaders = headers,
      requestedOrganizationId = organizationId,
      requestedDocumentId = documentId,
    }: {
      body?: unknown;
      requestHeaders?: Record<string, string>;
      requestedOrganizationId?: string;
      requestedDocumentId?: string;
    } = {}) =>
      app.request(
        `/api/organizations/${requestedOrganizationId}/documents/${requestedDocumentId}/enrich`,
        { method: 'POST', headers: requestHeaders, body: JSON.stringify(body) },
      ),
    runNextJob: async () => {
      const { job } = await dependencies.taskServices.getDriver().getNextJobAndMarkAsProcessing({
        abortSignal: AbortSignal.timeout(1_000),
      });
      const { taskDefinition } = dependencies.taskServices.getTaskRegistry().getTaskOrThrow({
        taskName: job.taskName,
      });
      await taskDefinition.handler({ data: job.data, context: { workerId: 'test' } });
      return job;
    },
  };
}

describe('manual document enrichment', () => {
  test('a request queues enrichment of existing text and the shared task adds tags without removing existing ones', async () => {
    const deps = await createTestDeps();

    const response = await deps.request();

    expect(response.status).toEqual(202);
    const { taskId } = v.parse(taskResponseSchema, await response.json());
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 1 });
    expect(deps.generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId, tagId: 'tag_manual' },
    ]);

    const job = await deps.runNextJob();

    expect(job).toMatchObject({
      id: taskId,
      taskName: 'enrich-document',
      data: { ...documentIds, capabilities: ['auto-tagging'] },
    });
    expect(deps.generateStructuredData).toHaveBeenCalledTimes(1);
    const [request] = deps.generateStructuredData.mock.calls[0]!;
    expect(request).toMatchObject({
      organizationId,
      modelId: 'openai://test-model',
      source: 'auto-tagging',
    });
    expect(request.userPrompt).toContain('Invoice for office supplies');
    expect(await deps.documentsRepository.getDocumentById(documentIds)).toMatchObject({
      document: { content: 'Invoice for office supplies' },
    });
    expect(
      (await deps.db.select().from(documentsTagsTable)).map(({ tagId }) => tagId).toSorted(),
    ).toEqual(['tag_finance', 'tag_manual']);
  });

  test('repeated requests schedule separate jobs', async () => {
    const deps = await createTestDeps();

    const firstResponse = await deps.request();
    const secondResponse = await deps.request();

    expect(firstResponse.status).toEqual(202);
    expect(secondResponse.status).toEqual(202);
    const first = v.parse(taskResponseSchema, await firstResponse.json());
    const second = v.parse(taskResponseSchema, await secondResponse.json());
    expect(first.taskId === second.taskId).toEqual(false);
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 2 });
  });

  test('requests require authentication', async () => {
    const deps = await createTestDeps();

    const response = await deps.request({ requestHeaders: { 'Content-Type': 'application/json' } });

    expect(response.status).toEqual(401);
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('API keys require document update permission', async () => {
    const deps = await createTestDeps({ permissions: ['documents:read'] });

    const response = await deps.request();

    expect(response.status).toEqual(401);
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('users outside the organization cannot schedule enrichment', async () => {
    const deps = await createTestDeps();

    const response = await deps.request({
      requestedOrganizationId: otherOrganizationId,
      requestedDocumentId: foreignDocumentId,
    });

    expect(response.status).toEqual(403);
    expect(await response.json()).toMatchObject({ error: { code: 'user.not_in_organization' } });
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('missing documents and documents from another organization are not found', async () => {
    const deps = await createTestDeps();

    for (const requestedDocumentId of ['doc_333333333333333333333333', foreignDocumentId]) {
      const response = await deps.request({ requestedDocumentId });

      expect(response.status).toEqual(404);
      expect(await response.json()).toMatchObject({ error: { code: 'document.not_found' } });
    }
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('deleted documents cannot be enriched', async () => {
    const deps = await createTestDeps({ isDeleted: true });

    const response = await deps.request();

    expect(response.status).toEqual(404);
    expect(await response.json()).toMatchObject({ error: { code: 'document.not_found' } });
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('disabled server AI prevents scheduling', async () => {
    const deps = await createTestDeps({ aiEnabled: false });

    const response = await deps.request();

    expect(response.status).toEqual(403);
    expect(await response.json()).toMatchObject({
      error: { code: 'document_enrichment.disabled' },
    });
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('disabled server auto-tagging prevents scheduling', async () => {
    const deps = await createTestDeps({ autoTaggingEnabled: false });

    const response = await deps.request();

    expect(response.status).toEqual(403);
    expect(await response.json()).toMatchObject({
      error: { code: 'document_enrichment.disabled' },
    });
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('disabled organization auto-tagging prevents scheduling', async () => {
    const deps = await createTestDeps({ organizationAutoTaggingEnabled: false });

    const response = await deps.request();

    expect(response.status).toEqual(403);
    expect(await response.json()).toMatchObject({
      error: { code: 'document_enrichment.disabled' },
    });
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('disabling organization auto-tagging after scheduling prevents inference', async () => {
    const deps = await createTestDeps();
    const response = await deps.request();
    expect(response.status).toEqual(202);
    await deps.organizationSettingsRepository.createOrUpdateOrganizationSettings({
      organizationId,
      settings: { aiAutoTaggingEnabled: false },
    });

    await deps.runNextJob();

    expect(deps.generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId, tagId: 'tag_manual' },
    ]);
  });

  test('a document deleted after scheduling is not sent to the AI', async () => {
    const deps = await createTestDeps();
    const response = await deps.request();
    expect(response.status).toEqual(202);
    await deps.documentsRepository.softDeleteDocument({ ...documentIds, userId: 'usr_alice' });

    await expect(deps.runNextJob()).rejects.toMatchObject({ code: 'document.not_found' });

    expect(deps.generateStructuredData).not.toHaveBeenCalled();
    expect(await deps.db.select().from(documentsTagsTable)).toEqual([
      { documentId, tagId: 'tag_manual' },
    ]);
  });

  test('documents without meaningful extracted text cannot be scheduled', async () => {
    const deps = await createTestDeps({ content: ' \n\t ' });

    const response = await deps.request();

    expect(response.status).toEqual(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'document_enrichment.content_required' },
    });
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });

  test('requests must select supported capabilities and cannot override organization settings', async () => {
    const deps = await createTestDeps();

    for (const body of [
      {},
      { capabilities: [] },
      { capabilities: ['document-renaming'] },
      { capabilities: ['auto-tagging', 'unknown'] },
      { capabilities: 'auto-tagging' },
      { capabilities: ['auto-tagging'], canCreateNewTags: true },
    ]) {
      const response = await deps.request({ body });

      expect(response.status).toEqual(400);
    }
    expect(await deps.taskServices.getJobCount()).toEqual({ count: 0 });
  });
});
