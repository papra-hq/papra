import type { Logger } from '@crowlog/logger';
import pLimit from 'p-limit';
import type { AiServices } from '../ai/ai.services';
import type { EventServices } from '../app/events/events.services';
import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import type { TagsRepository } from '../tags/tags.repository';
import type { Tag } from '../tags/tags.types';
import { ensureModelId } from '../ai/ai.models';
import { getDocumentDateAction } from '../auto-document-date/auto-document-date.models';
import { getTitleAction } from '../auto-naming/auto-naming.models';
import { getTagsActions } from '../auto-tagging/auto-tagging.models';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createLogger } from '../shared/logger/logger';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import type {
  AutoDocumentDateOptions,
  AutoNamingOptions,
  AutoTaggingOptions,
} from './auto-processing.models';
import {
  buildAutoProcessingSchema,
  buildAutoProcessingSystemPrompt,
  buildAutoProcessingUserPrompt,
} from './auto-processing.models';

export async function promptForAutoProcessing({
  aiServices,
  document,
  modelId,
  tagging,
  naming,
  dating,
}: {
  aiServices: AiServices;
  document: { content: string; name: string; originalName?: string; organizationId: string };
  modelId: string;
  tagging?: AutoTaggingOptions;
  naming?: AutoNamingOptions;
  dating?: AutoDocumentDateOptions;
}) {
  const autoProcessingResponse = await aiServices.generateStructuredData({
    modelId,
    organizationId: document.organizationId,
    source: 'auto-processing',
    schema: buildAutoProcessingSchema({ tagging, naming, dating }),
    systemPrompt: buildAutoProcessingSystemPrompt({ tagging, naming, dating }),
    userPrompt: buildAutoProcessingUserPrompt({ document }),
  });

  return {
    tagsActions: tagging
      ? getTagsActions({
          autoTaggingResponse: autoProcessingResponse,
          existingTags: tagging.existingTags,
          maxTags: tagging.maxTags,
        })
      : undefined,
    titleAction: naming
      ? getTitleAction({
          autoNamingResponse: autoProcessingResponse,
          currentName: document.name,
          originalName: document.originalName,
          maxTitleLength: naming.maxTitleLength,
        })
      : undefined,
    dateAction: dating
      ? getDocumentDateAction({ autoDocumentDateResponse: autoProcessingResponse, now: dating.now })
      : undefined,
  };
}

// Auto-tagging, auto-naming and document date extraction share a single AI request so the document content is only sent once
export async function autoProcessDocument({
  aiServices,
  documentId,
  organizationId,
  documentsRepository,
  tagsRepository,
  resolveOrganizationSettings,
  eventServices,
  config,
  now = new Date(),
  logger = createLogger({ namespace: 'autoProcessDocument' }),
}: {
  aiServices: AiServices;
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  tagsRepository: TagsRepository;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  eventServices: EventServices;
  config: Config;
  now?: Date;
  logger?: Logger;
}) {
  const [{ document }, { tags: existingTags }, { organizationSettings }] = await Promise.all([
    documentsRepository.getDocumentById({ documentId, organizationId }),
    tagsRepository.getOrganizationTags({ organizationId }),
    resolveOrganizationSettings({ organizationId }),
  ]);

  if (!document) {
    throw createDocumentNotFoundError();
  }

  if (document.isDeleted) {
    logger.info({ documentId, organizationId }, 'Document is deleted. Skipping auto-processing.');
    return;
  }

  const { autoTagging, autoNaming, autoDocumentDate } = organizationSettings.ai;

  const isTaggingEnabled = config.autoTagging.isEnabled && autoTagging.isEnabled;
  const canTag = existingTags.length > 0 || autoTagging.canCreateNewTags;
  const isNamingEnabled = config.autoNaming.isEnabled && autoNaming.isEnabled;
  const isDatingEnabled = config.autoDocumentDate.isEnabled && autoDocumentDate.isEnabled;

  if (isTaggingEnabled && !canTag) {
    logger.info(
      { documentId, organizationId },
      'No tags available and cannot create new tags. Skipping auto-tagging.',
    );
  }

  const tagging: AutoTaggingOptions | undefined =
    isTaggingEnabled && canTag
      ? {
          existingTags,
          canCreateNewTags: autoTagging.canCreateNewTags,
          maxTags: autoTagging.maxTags,
        }
      : undefined;
  const naming: AutoNamingOptions | undefined = isNamingEnabled
    ? { maxTitleLength: config.autoNaming.maxTitleLength }
    : undefined;

  // A date set by the user, or by a previous run, is never overwritten
  const dating: AutoDocumentDateOptions | undefined =
    isDatingEnabled && document.documentDate === null ? { now } : undefined;

  if (!tagging && !naming && !dating) {
    logger.info(
      { documentId, organizationId },
      'Auto-tagging, auto-naming and document date extraction are disabled or not applicable. Skipping auto-processing.',
    );
    return;
  }

  const startedAt = Date.now();
  const { tagsActions, titleAction, dateAction } = await promptForAutoProcessing({
    aiServices,
    document,
    modelId: ensureModelId(autoTagging.modelId),
    tagging,
    naming,
    dating,
  });
  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      documentId,
      organizationId,
      durationMs,
      isTagging: Boolean(tagging),
      isNaming: Boolean(naming),
      isDating: Boolean(dating),
    },
    'Auto-processing completed',
  );

  if (titleAction?.shouldRename) {
    await renameDocumentIfUnchanged({
      documentId,
      organizationId,
      expectedName: document.name,
      name: titleAction.title,
      documentsRepository,
      eventServices,
      logger,
    });
  }

  if (dateAction?.documentDate) {
    await setDocumentDateIfUnset({
      documentId,
      organizationId,
      documentDate: dateAction.documentDate,
      documentsRepository,
      eventServices,
      logger,
    });
  }

  if (tagsActions) {
    await createAndApplyTags({
      documentId,
      organizationId,
      ...tagsActions,
      tagsRepository,
      eventServices,
      config,
      logger,
    });
  }
}

async function renameDocumentIfUnchanged({
  documentId,
  organizationId,
  expectedName,
  name,
  documentsRepository,
  eventServices,
  logger,
}: {
  documentId: string;
  organizationId: string;
  expectedName: string;
  name: string;
  documentsRepository: DocumentsRepository;
  eventServices: EventServices;
  logger: Logger;
}) {
  // The AI call can take a while, skip the rename if the document was renamed or deleted meanwhile
  const { document } = await documentsRepository.updateDocumentNameIfUnchanged({
    documentId,
    organizationId,
    expectedName,
    name,
  });

  if (!document) {
    logger.info(
      { documentId, organizationId },
      'Document was renamed or deleted during auto-naming. Skipping rename.',
    );
    return;
  }

  eventServices.emitEvent({
    eventName: 'document.updated',
    payload: {
      userId: undefined,
      changes: { name },
      document,
    },
  });
}

async function setDocumentDateIfUnset({
  documentId,
  organizationId,
  documentDate,
  documentsRepository,
  eventServices,
  logger,
}: {
  documentId: string;
  organizationId: string;
  documentDate: Date;
  documentsRepository: DocumentsRepository;
  eventServices: EventServices;
  logger: Logger;
}) {
  // The AI call can take a while, skip if the user set a date or deleted the document meanwhile
  const { document } = await documentsRepository.updateDocumentDateIfUnset({
    documentId,
    organizationId,
    documentDate,
  });

  if (!document) {
    logger.info(
      { documentId, organizationId },
      'Document date was set or document was deleted during auto-processing. Skipping document date.',
    );
    return;
  }

  eventServices.emitEvent({
    eventName: 'document.updated',
    payload: {
      userId: undefined,
      changes: { documentDate },
      document,
    },
  });
}

async function createAndApplyTags({
  documentId,
  organizationId,
  tagIdsToAdd,
  tagsToCreate,
  tagsRepository,
  eventServices,
  config,
  logger,
}: {
  documentId: string;
  organizationId: string;
  tagIdsToAdd: string[];
  tagsToCreate: { name: string; description?: string }[];
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  config: Config;
  logger: Logger;
}) {
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
