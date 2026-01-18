import type { Logger } from '../../shared/logger/logger';
import type { DocumentSearchServices } from './document-search.types';
import { createLogger } from '../../shared/logger/logger';

export async function searchOrganizationDocuments({
  searchQuery,
  organizationId,
  pageIndex,
  pageSize,
  documentSearchServices,
  logger = createLogger({ namespace: 'document-search.usecase' }),
}: {
  searchQuery: string;
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  documentSearchServices: DocumentSearchServices;
  logger?: Logger;
}) {
  const startTime = Date.now();
  const { documents, totalCount } = await documentSearchServices.searchDocuments({
    searchQuery,
    organizationId,
    pageIndex,
    pageSize,
  });
  const durationMs = Date.now() - startTime;

  logger.info({
    organizationId,
    pageIndex,
    pageSize,
    durationMs,
    pageDocumentCount: documents.length,
  }, 'Executed document search');

  return {
    documents,
    totalCount,
  };
}
