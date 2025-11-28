import type { Database } from '../../../app/database/database.types';
import type { DocumentSearchServices } from '../document-search.types';
import { DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME } from './database-fts5.document-search-provider.constants';
import { createDocumentSearchRepository } from './database-fts5.repository';

export function createDatabaseFts5DocumentSearchServices({ db }: { db: Database }): DocumentSearchServices {
  const documentsSearchRepository = createDocumentSearchRepository({ db });

  return {
    name: DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME,
    searchDocuments: async ({ searchQuery, organizationId, pageIndex, pageSize }) => {
      const { documents } = await documentsSearchRepository.searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize });

      return {
        searchResults: {
          documents: documents.map(({ id, name }) => ({ id, name })),
        },
      };
    },
  };
}
