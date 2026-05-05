import type { EventServices } from '../../app/events/events.services';
import type { Logger } from '../../shared/logger/logger';
import type { TagsRepository } from '../../tags/tags.repository';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';
import type { DocumentActivityRepository } from '../document-activity/document-activity.repository';
import type { DocumentSearchServices } from '../document-search/document-search.types';
import type { DocumentsRepository } from '../documents.repository';
import type { BatchTargetFilter } from './documents-batch.schemas';
import { createLogger } from '../../shared/logger/logger';
import { createTagNotFoundError } from '../../tags/tags.errors';
import { registerDocumentsActivityLog } from '../document-activity/document-activity.usecases';
import { createDocumentIdsNotFromOrganizationError } from './documents-batch.errors';

async function resolvePlainDocumentIdsBatchTargetFilter({
  documentIds,
  documentsRepository,
  organizationId,
}: {
  documentIds: string[];
  documentsRepository: DocumentsRepository;
  organizationId: string;
}): Promise<{ documentIds: string[] }> {
  const allDocumentsExistInOrganization = await documentsRepository.areAllDocumentsInOrganization({ documentIds, organizationId });

  if (!allDocumentsExistInOrganization) {
    throw createDocumentIdsNotFromOrganizationError();
  }

  return { documentIds };
}

export async function resolveBatchTargetDocumentIds({
  filter,
  organizationId,
  documentSearchServices,
  documentsRepository,
  logger = createLogger({ namespace: 'documents-batch.usecases' }),
}: {
  filter: BatchTargetFilter;
  organizationId: string;
  documentSearchServices: DocumentSearchServices;
  documentsRepository: DocumentsRepository;
  logger?: Logger;
}): Promise<{ documentIds: string[] }> {
  const startTime = Date.now();

  const { documentIds } = 'documentIds' in filter
    ? await resolvePlainDocumentIdsBatchTargetFilter({ documentIds: filter.documentIds, documentsRepository, organizationId })
    : await documentSearchServices.getDocumentIdsMatchingQuery({ organizationId, searchQuery: filter.query });

  logger.info({
    organizationId,
    filterKind: 'documentIds' in filter ? 'documentIds' : 'query',
    resolvedCount: documentIds.length,
    durationMs: Date.now() - startTime,
  }, 'Resolved batch target document ids');

  return { documentIds };
}

export async function trashDocumentsBatch({
  filter,
  organizationId,
  userId,
  documentsRepository,
  documentSearchServices,
  eventServices,
  logger = createLogger({ namespace: 'documents-batch.usecases' }),
}: {
  filter: BatchTargetFilter;
  organizationId: string;
  userId: string;
  documentsRepository: DocumentsRepository;
  documentSearchServices: DocumentSearchServices;
  eventServices: EventServices;
  logger?: Logger;
}) {
  const startTime = Date.now();

  const { documentIds } = await resolveBatchTargetDocumentIds({ filter, organizationId, documentSearchServices, documentsRepository, logger });

  const { trashedDocumentIds } = await documentsRepository.softDeleteDocuments({
    documentIds,
    organizationId,
    userId,
  });

  if (trashedDocumentIds.length > 0) {
    eventServices.emitEvent({
      eventName: 'documents.trashed',
      payload: { documentIds: trashedDocumentIds, organizationId, trashedBy: userId },
    });
  }

  logger.info({
    organizationId,
    userId,
    resolvedCount: documentIds.length,
    trashedCount: trashedDocumentIds.length,
    skippedCount: documentIds.length - trashedDocumentIds.length,
    durationMs: Date.now() - startTime,
  }, 'Executed batch document trash');

  return {
    trashedDocumentIds,
    trashedCount: trashedDocumentIds.length,
  };
}

export async function tagDocumentsBatch({
  filter,
  addTagIds,
  removeTagIds,
  organizationId,
  userId,
  documentsRepository,
  tagsRepository,
  documentSearchServices,
  webhookTriggerServices,
  documentActivityRepository,
  logger = createLogger({ namespace: 'documents-batch.usecases' }),
}: {
  filter: BatchTargetFilter;
  addTagIds: string[];
  removeTagIds: string[];
  organizationId: string;
  userId: string;
  documentsRepository: DocumentsRepository;
  tagsRepository: TagsRepository;
  documentSearchServices: DocumentSearchServices;
  webhookTriggerServices: WebhookTriggerServices;
  documentActivityRepository: DocumentActivityRepository;
  logger?: Logger;
}) {
  const requestedTagIds = [...new Set([...addTagIds, ...removeTagIds])];
  const { tags } = await tagsRepository.getTagsByIds({ tagIds: requestedTagIds, organizationId });

  if (tags.length !== requestedTagIds.length) {
    throw createTagNotFoundError();
  }

  const tagsById = new Map(tags.map(tag => [tag.id, tag]));

  const { documentIds } = await resolveBatchTargetDocumentIds({ filter, organizationId, documentSearchServices, documentsRepository, logger });

  if (documentIds.length === 0) {
    logger.info({
      organizationId,
      userId,
      addTagCount: addTagIds.length,
      removeTagCount: removeTagIds.length,
    }, 'Executed batch document tag (no target documents)');
    return { taggedCount: 0, untaggedCount: 0, insertedPairs: [], removedPairs: [] };
  }

  const [{ insertedPairs }, { removedPairs }] = await Promise.all([
    tagsRepository.addTagsToDocumentsBatch({ documentIds, tagIds: addTagIds }),
    tagsRepository.removeTagsFromDocumentsBatch({ documentIds, tagIds: removeTagIds }),
  ]);

  if (insertedPairs.length > 0) {
    webhookTriggerServices.deferTriggerWebhooks({
      organizationId,
      event: 'document:tag:added',
      payloads: insertedPairs.map(({ documentId, tagId }) => ({
        documentId,
        organizationId,
        tagId,
        tagName: tagsById.get(tagId)?.name ?? '',
      })),
    });
  }

  if (removedPairs.length > 0) {
    webhookTriggerServices.deferTriggerWebhooks({
      organizationId,
      event: 'document:tag:removed',
      payloads: removedPairs.map(({ documentId, tagId }) => ({
        documentId,
        organizationId,
        tagId,
        tagName: tagsById.get(tagId)?.name ?? '',
      })),
    });
  }

  await registerDocumentsActivityLog({
    activities: [
      ...insertedPairs.map(({ documentId, tagId }) => ({ documentId, event: 'tagged' as const, userId, tagId })),
      ...removedPairs.map(({ documentId, tagId }) => ({ documentId, event: 'untagged' as const, userId, tagId })),
    ],
    documentActivityRepository,
  });

  logger.info({
    organizationId,
    userId,
    resolvedCount: documentIds.length,
    addTagCount: addTagIds.length,
    removeTagCount: removeTagIds.length,
    taggedCount: insertedPairs.length,
    untaggedCount: removedPairs.length,
  }, 'Executed batch document tag');

  return {
    taggedCount: insertedPairs.length,
    untaggedCount: removedPairs.length,
    insertedPairs,
    removedPairs,
  };
}
