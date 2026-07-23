import type { AiServices } from '../ai/ai.services';
import type { TagsRepository } from '../tags/tags.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import type { DocumentsRepository } from '../documents/documents.repository';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import type { Logger } from '@crowlog/logger';
import { createLogger } from '../shared/logger/logger';
import type { Tag } from '../tags/tags.types';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import pLimit from 'p-limit';
import type { Config } from '../config/config.types';
import type { EventServices } from '../app/events/events.services';
import {
  buildAutoTaggingSchema,
  buildAutoTaggingSystemPrompt,
  buildAutoTaggingUserPrompt,
  getTagsActions,
} from './auto-tagging.models';
import { ensureModelId } from '../ai/ai.models';

export async function promptForAutoTagging({
  aiServices,
  document,
  existingTags,
  canCreateNewTags,
  maxTags,
  modelId,
}: {
  aiServices: AiServices;
  document: { content: string; name: string; organizationId: string };
  existingTags: { id: string; name: string; description?: string | null }[];
  canCreateNewTags: boolean;
  maxTags: number;
  modelId: string;
}) {
  const autoTaggingResponse = await aiServices.generateStructuredData({
    modelId,
    organizationId: document.organizationId,
    source: 'auto-tagging',
    schema: buildAutoTaggingSchema({ existingTags, canCreateNewTags }),
    systemPrompt: buildAutoTaggingSystemPrompt({ existingTags, canCreateNewTags, maxTags }),
    userPrompt: buildAutoTaggingUserPrompt({ document }),
  });

  const { tagIdsToAdd, tagsToCreate } = getTagsActions({
    autoTaggingResponse,
    existingTags,
    maxTags,
  });

  return { tagIdsToAdd, tagsToCreate };
}

export async function autoTagDocument({
  aiServices,
  documentId,
  organizationId,
  documentsRepository,
  tagsRepository,
  resolveOrganizationSettings,
  eventServices,
  config,
  logger = createLogger({ namespace: 'autoTagDocument' }),
}: {
  aiServices: AiServices;
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  tagsRepository: TagsRepository;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  eventServices: EventServices;
  config: Config;
  logger?: Logger;
}) {
  const [{ document }, { tags: existingTags }, { organizationSettings }] = await Promise.all([
    documentsRepository.getDocumentById({ documentId, organizationId }),
    tagsRepository.getOrganizationTags({ organizationId }),
    resolveOrganizationSettings({ organizationId }),
  ]);

  const orgHasNoExistingTags = existingTags.length === 0;
  const {
    canCreateNewTags,
    maxTags,
    isEnabled: isAutoTaggingEnabled,
  } = organizationSettings.ai.autoTagging;

  if (orgHasNoExistingTags && !canCreateNewTags) {
    logger.info(
      { documentId, organizationId },
      'No tags available and cannot create new tags. Skipping auto-tagging.',
    );
    return;
  }

  if (!isAutoTaggingEnabled) {
    logger.info(
      { documentId, organizationId },
      'Auto-tagging is disabled in organization settings. Skipping auto-tagging.',
    );
    return;
  }

  if (!document) {
    throw createDocumentNotFoundError();
  }

  const startedAt = Date.now();
  const { tagIdsToAdd, tagsToCreate } = await promptForAutoTagging({
    aiServices,
    document,
    existingTags,
    canCreateNewTags,
    maxTags,
    modelId: ensureModelId(organizationSettings.ai.autoTagging.modelId),
  });
  const durationMs = Date.now() - startedAt;
  logger.info({ documentId, organizationId, durationMs }, 'Auto-tagging completed');

  const limit = pLimit(5);

  // TODO: introduce a createTags method with a new checkIfOrganizationCanCreateNewTag
  const createdTagsResults = await Promise.allSettled(
    tagsToCreate.map(async ({ name, description }) =>
      limit(async () =>
        createTag({
          organizationId,
          color: '#CCCCCC',
          name,
          description,
          config,
          tagsRepository,
        }),
      ),
    ),
  );

  const createdTags = createdTagsResults
    .filter(
      (result): result is PromiseFulfilledResult<{ tag: Tag }> => result.status === 'fulfilled',
    )
    .map((result) => result.value.tag);

  await applyTagsToDocuments({
    documentIds: [documentId],
    addTagIds: [...tagIdsToAdd, ...createdTags.map((tag) => tag.id)],
    removeTagIds: [],
    organizationId,
    userId: undefined,
    tagsRepository,
    eventServices,
    logger,
  });
}
