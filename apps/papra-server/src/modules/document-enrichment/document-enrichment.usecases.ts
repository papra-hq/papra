import type { Logger } from '@crowlog/logger';
import { ensureModelId } from '../ai/ai.models';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createLogger } from '../shared/logger/logger';
import type { TagsRepository } from '../tags/tags.repository';
import type { Config } from '../config/config.types';
import type { TaskServices } from '../tasks/tasks.services';
import type { DocumentEnrichmentCapability } from './document-enrichment.schemas';
import {
  createDocumentEnrichmentContentRequiredError,
  createDocumentEnrichmentDisabledError,
} from './document-enrichment.errors';
import type { GenericObjectSchema } from '../shared/schemas/objects.schemas';
import type { DocumentEnrichmentCapabilityDefinition } from './enrichment-capabilities/enrichment-capabilities-definition';
import type { AiServices } from '../ai/ai.services';
import * as v from 'valibot';

export function buildScheduleDocumentEnrichment({
  config,
  documentsRepository,
  resolveOrganizationSettings,
  taskServices,
}: {
  config: Pick<Config, 'ai' | 'autoTagging'>;
  documentsRepository: Pick<DocumentsRepository, 'getDocumentById'>;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  taskServices: Pick<TaskServices, 'scheduleJob'>;
}) {
  return async ({
    documentId,
    organizationId,
    capabilities,
  }: {
    documentId: string;
    organizationId: string;
    capabilities: DocumentEnrichmentCapability[];
  }) => {
    if (!config.ai.isEnabled || !config.autoTagging.isEnabled) {
      throw createDocumentEnrichmentDisabledError();
    }

    const [{ document }, { organizationSettings }] = await Promise.all([
      documentsRepository.getDocumentById({ documentId, organizationId }),
      resolveOrganizationSettings({ organizationId }),
    ]);

    if (!document || document.isDeleted) {
      throw createDocumentNotFoundError();
    }

    if (capabilities.includes('auto-tagging') && !organizationSettings.ai.autoTagging.isEnabled) {
      throw createDocumentEnrichmentDisabledError();
    }

    if (document.content.trim().length === 0) {
      throw createDocumentEnrichmentContentRequiredError();
    }

    const { jobId: taskId } = await taskServices.scheduleJob({
      taskName: 'enrich-document',
      data: { documentId, organizationId, capabilities },
    });

    return { taskId };
  };
}

export function buildEnrichDocument<ResponseSchema extends GenericObjectSchema>({
  capabilityDefinitions,
  documentsRepository,
  tagsRepository,
  resolveOrganizationSettings,
  aiServices,
  logger = createLogger({ namespace: 'documentEnrichment' }),
}: {
  capabilityDefinitions: DocumentEnrichmentCapabilityDefinition<
    DocumentEnrichmentCapability,
    ResponseSchema
  >[];
  documentsRepository: Pick<DocumentsRepository, 'getDocumentById'>;
  tagsRepository: Pick<TagsRepository, 'getOrganizationTags'>;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  aiServices: AiServices;
  logger?: Logger;
}) {
  return async ({
    documentId,
    organizationId,
    capabilities = ['auto-tagging'],
  }: {
    documentId: string;
    organizationId: string;
    capabilities?: DocumentEnrichmentCapability[];
  }) => {
    const selectedCapabilities = capabilityDefinitions.filter((capability) =>
      capabilities.includes(capability.name),
    );

    if (selectedCapabilities.length === 0) {
      logger.info(
        { documentId, organizationId, capabilities },
        'No valid enrichment capabilities selected. Skipping enrichment.',
      );
      return;
    }

    const [{ document }, { tags: existingTags }, { organizationSettings }] = await Promise.all([
      documentsRepository.getDocumentById({ documentId, organizationId }),
      tagsRepository.getOrganizationTags({ organizationId }),
      resolveOrganizationSettings({ organizationId }),
    ]);

    if (!document || document.isDeleted) {
      throw createDocumentNotFoundError();
    }

    const availableCapabilities = selectedCapabilities.filter((capability) =>
      capability.isAvailable({ organizationSettings, tags: existingTags }),
    );

    if (availableCapabilities.length === 0) {
      logger.info(
        { documentId, organizationId, capabilities },
        'No enrichment capabilities are enabled for this organization or instance. Skipping enrichment.',
      );
      return;
    }

    const promptContext = availableCapabilities.map((capability) => ({
      capability,
      systemPromptFragments: capability.buildSystemPromptFragments({
        organizationSettings,
        tags: existingTags,
      }),
      responseSchema: capability.getResponseSchema({
        organizationSettings,
        tags: existingTags,
      }),
    }));

    const systemPromptSpecifics = promptContext
      .map((context) => context.systemPromptFragments.fragment)
      .join('\n\n');

    const systemPrompt = [
      'You enrich documents for an archiving application.',
      'Given extracted document text, an original filename, return:',

      systemPromptSpecifics,
    ].join('\n\n');

    const requireTags = availableCapabilities.some((capability) =>
      capability.documentInfoRequirements?.includes('tags'),
    );

    const userPrompt = JSON.stringify({
      document: {
        name: document?.originalName,
        content: document?.content,
      },
      ...(requireTags
        ? {
            existingTags: existingTags.map((tag) => ({
              name: tag.name,
              description: tag.description,
            })),
          }
        : {}),
    });

    const schemaEntries = promptContext.reduce<v.ObjectEntries>(
      (acc, { responseSchema }) => ({ ...acc, ...responseSchema.entries }),
      {},
    );

    const enrichmentResponse = await aiServices.generateStructuredData({
      modelId: ensureModelId(organizationSettings.ai.autoTagging.modelId),
      organizationId: document.organizationId,
      source: 'document-enrichment',
      schema: v.object(schemaEntries),
      systemPrompt,
      userPrompt,
    });

    const enrichmentResults = await Promise.allSettled(
      promptContext.map(async ({ capability, responseSchema }) =>
        capability.apply({
          response: enrichmentResponse as v.InferOutput<typeof responseSchema>,
          documentId,
          organizationId,
          tags: existingTags,
          organizationSettings,
        }),
      ),
    );

    const failures = enrichmentResults.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failures.length > 0) {
      logger.error(
        {
          documentId,
          organizationId,
          capabilities: availableCapabilities.map((capability) => capability.name),
          failures: failures.map((failure) => failure.reason),
        },
        'One or more document enrichment capabilities failed to apply.',
      );

      throw new AggregateError(
        failures.map((failure) => failure.reason),
        'One or more document enrichment capabilities failed to apply.',
      );
    }

    logger.info(
      {
        documentId,
        organizationId,
        capabilities: availableCapabilities.map((capability) => capability.name),
      },
      'Document enrichment completed.',
    );
  };
}
