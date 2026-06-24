import type { EventServices } from '../app/events/events.services';
import type { Config } from '../config/config.types';
import type { DocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import type { Logger } from '../shared/logger/logger';
import type { WebhookTriggerServices } from '../webhooks/webhooks.trigger.services';
import type { TagsRepository } from './tags.repository';
import type { Tag } from './tags.types';
import { deferRegisterDocumentActivityLog } from '../documents/document-activity/document-activity.usecases';
import { createLogger } from '../shared/logger/logger';
import { createOrganizationTagLimitReachedError, createTagNotFoundError } from './tags.errors';

export async function checkIfOrganizationCanCreateNewTag({
  organizationId,
  config,
  tagsRepository,
}: {
  organizationId: string;
  config: Config;
  tagsRepository: TagsRepository;
}) {
  const { tagsCount } = await tagsRepository.getOrganizationTagsCount({ organizationId });

  if (tagsCount >= config.tags.maxTagsPerOrganization) {
    throw createOrganizationTagLimitReachedError();
  }
}

export async function createTag({
  organizationId,
  name,
  color,
  description,
  config,
  tagsRepository,
}: {
  organizationId: string;
  name: string;
  color: string;
  description?: string;
  config: Config;
  tagsRepository: TagsRepository;
}) {
  await checkIfOrganizationCanCreateNewTag({ organizationId, config, tagsRepository });

  const { tag } = await tagsRepository.createTag({
    tag: { organizationId, name, color, description },
  });

  return { tag };
}

export async function addTagToDocument({
  tagId,
  documentId,
  organizationId,
  userId,
  tag,

  tagsRepository,
  webhookTriggerServices,
  documentActivityRepository,
}: {
  tagId: string;
  documentId: string;
  organizationId: string;
  userId?: string;
  tag: Tag;

  tagsRepository: TagsRepository;
  webhookTriggerServices: WebhookTriggerServices;
  documentActivityRepository: DocumentActivityRepository;
}) {
  await tagsRepository.addTagToDocument({ tagId, documentId });

  webhookTriggerServices.deferTriggerWebhooks({
    organizationId,
    event: 'document:tag:added',
    payloads: [{ documentId, organizationId, tagId, tagName: tag.name }],
  });

  deferRegisterDocumentActivityLog({
    documentId,
    event: 'tagged',
    userId,
    documentActivityRepository,
    tagId,
  });
}

export type DocumentTagPair = { documentId: string; tagId: string };

export async function applyTagsToDocuments({
  documentIds,
  addTagIds = [],
  removeTagIds = [],
  organizationId,
  userId,

  tagsRepository,
  eventServices,
  logger = createLogger({ namespace: 'tags.usecases' }),
}: {
  documentIds: string[];
  addTagIds?: string[];
  removeTagIds?: string[];
  organizationId: string;
  userId?: string;

  tagsRepository: TagsRepository;
  eventServices: EventServices;
  logger?: Logger;
}): Promise<{ insertedPairs: DocumentTagPair[]; removedPairs: DocumentTagPair[] }> {
  if (documentIds.length === 0 || (addTagIds.length === 0 && removeTagIds.length === 0)) {
    return { insertedPairs: [], removedPairs: [] };
  }

  const requestedTagIds = [...new Set([...addTagIds, ...removeTagIds])];
  const { tags } = await tagsRepository.getTagsByIds({ tagIds: requestedTagIds, organizationId });

  if (tags.length !== requestedTagIds.length) {
    throw createTagNotFoundError();
  }

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));

  const [{ insertedPairs }, { removedPairs }] = await Promise.all([
    tagsRepository.addTagsToDocumentsBatch({ documentIds, tagIds: addTagIds }),
    tagsRepository.removeTagsFromDocumentsBatch({ documentIds, tagIds: removeTagIds }),
  ]);

  if (insertedPairs.length > 0 || removedPairs.length > 0) {
    const toEventPair = ({ documentId, tagId }: DocumentTagPair) => ({
      documentId,
      tagId,
      tagName: tagsById.get(tagId)?.name ?? '',
    });

    eventServices.emitEvent({
      eventName: 'document.tags.changed',
      payload: {
        organizationId,
        userId,
        addedPairs: insertedPairs.map(toEventPair),
        removedPairs: removedPairs.map(toEventPair),
      },
    });
  }

  logger.info(
    {
      organizationId,
      userId,
      documentCount: documentIds.length,
      taggedCount: insertedPairs.length,
      untaggedCount: removedPairs.length,
    },
    'Applied tag changes to documents',
  );

  return { insertedPairs, removedPairs };
}
