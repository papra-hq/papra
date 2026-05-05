import type { EventServices } from '../../app/events/events.services';
import type { Logger } from '../../shared/logger/logger';
import type { DocumentSearchServices } from '../document-search/document-search.types';
import type { DocumentsRepository } from '../documents.repository';
import type { BatchTargetFilter } from './documents-batch.schemas';
import { createLogger } from '../../shared/logger/logger';
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
