import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME } from './database-fts5/database-fts5.document-search-provider.constants';

const documentSearchProviderNames = [DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME] as const;

export const documentSearchConfig = {
  providerName: {
    doc: `The document search provider to use, values can be one of: ${documentSearchProviderNames.map(x => `\`${x}\``).join(', ')}`,
    default: DATABASE_FTS5_DOCUMENT_SEARCH_PROVIDER_NAME,
    env: 'DOCUMENT_SEARCH_DRIVER',
    schema: z.enum(documentSearchProviderNames),
  },
} as const satisfies ConfigDefinition;
