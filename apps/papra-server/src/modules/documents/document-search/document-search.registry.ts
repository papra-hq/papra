import type { Config } from '../../config/config.types';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { createDatabaseFts5DocumentSearchServices } from './database-fts5/database-fts5.document-search-provider';
import { DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME } from './database-fts5/database-fts5.document-search-provider.constants';

const searchServicesFactories = {
  [DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME]: createDatabaseFts5DocumentSearchServices,
};

type DocumentsSearchFactoriesArgs = {
  [K in keyof typeof searchServicesFactories]: Parameters<typeof searchServicesFactories[K]>[0];
}[keyof typeof searchServicesFactories];

export function createDocumentSearchServices({
  config,
  ...args
}: {
  config: Config;
} & DocumentsSearchFactoriesArgs) {
  const { providerName } = config.documentSearch;

  const searchServicesFactory = searchServicesFactories[providerName];

  if (isNil(searchServicesFactory)) {
    throw createError({
      message: `Unknown document search provider: ${providerName}`,
      code: 'document_search_provider.unknown_provider',
      isInternal: true,
      statusCode: 500,
    });
  }

  return searchServicesFactory({ ...args });
}
