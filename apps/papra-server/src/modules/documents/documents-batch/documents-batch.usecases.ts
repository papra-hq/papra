import type { EventServices } from '../../app/events/events.services';
import type { Logger } from '../../shared/logger/logger';
import type { DocumentSearchServices } from '../document-search/document-search.types';
import type { DocumentsRepository } from '../documents.repository';
import type { BatchTargetFilter } from './documents-batch.schemas';
import { createLogger } from '../../shared/logger/logger';

export async function resolveBatchTargetDocumentIds({
  filter,
  organizationId,
  documentSearchServices,
  logger = createLogger({ namespace: 'documents-batch.usecases' }),
}: {
  filter: BatchTargetFilter;
  organizationId: string;
  documentSearchServices: DocumentSearchServices;
  logger?: Logger;
}): Promise<{ documentIds: string[] }> {
  const startTime = Date.now();

  const { documentIds, filterKind } = 'documentIds' in filter
    ? { documentIds: filter.documentIds, filterKind: 'documentIds' as const }
    : { ...(await documentSearchServices.getDocumentIdsMatchingQuery({ organizationId, searchQuery: filter.query })), filterKind: 'query' as const };

  logger.info({
    organizationId,
    filterKind,
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

  const { documentIds } = await resolveBatchTargetDocumentIds({ filter, organizationId, documentSearchServices, logger });

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
