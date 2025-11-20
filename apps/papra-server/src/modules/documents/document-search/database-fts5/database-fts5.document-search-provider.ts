import type { Database } from '../../../app/database/database.types';
import type { DocumentSearchServices } from '../document-search.types';
import { createDocumentsRepository } from '../../documents.repository';
import { DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME } from './database-fts5.document-search-provider.constants';

export function createDatabaseFts5DocumentSearchServices({ db }: { db: Database }): DocumentSearchServices {
  const documentsRepository = createDocumentsRepository({ db });

  return {
    name: DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME,
    searchDocuments: async ({ searchQuery, organizationId, pageIndex, pageSize }) => {
      const { documents } = await documentsRepository.searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize });

      return {
        searchResults: {
          documents: documents.map(({ id, name }) => ({ id, name })),
        },
      };
    },
  };
}
