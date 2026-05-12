import type { Logger } from '../../shared/logger/logger';
import type { DocumentSearchSort } from './document-search.constants';
import type { DocumentSearchServices } from './document-search.types';
import { createLogger } from '../../shared/logger/logger';
import { DEFAULT_DOCUMENT_SEARCH_SORT } from './document-search.constants';

export async function searchOrganizationDocuments({
  searchQuery,
  organizationId,
  pageIndex,
  pageSize,
  sort = DEFAULT_DOCUMENT_SEARCH_SORT,
  documentSearchServices,
  logger = createLogger({ namespace: 'document-search.usecase' }),
}: {
  searchQuery: string;
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  sort?: DocumentSearchSort;
  documentSearchServices: DocumentSearchServices;
  logger?: Logger;
}) {
  const startTime = Date.now();
  const { documents, documentsCount } = await documentSearchServices.searchDocuments({
    searchQuery,
    organizationId,
    pageIndex,
    pageSize,
    sort,
  });
  const durationMs = Date.now() - startTime;

  logger.info({
    organizationId,
    pageIndex,
    pageSize,
    sortField: sort.field,
    sortOrder: sort.order,
    durationMs,
    pageDocumentCount: documents.length,
  }, 'Executed document search');

  return {
    documents,
    documentsCount,
  };
}
