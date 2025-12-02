import type { Database } from '../../../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { sql } from 'drizzle-orm';
import { documentsTable } from '../../documents.table';

export type DocumentSearchRepository = ReturnType<typeof createDocumentSearchRepository>;

export function createDocumentSearchRepository({ db }: { db: Database }) {
  return injectArguments({
    searchOrganizationDocuments,
  }, { db });
}

async function searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize, db }: { organizationId: string; searchQuery: string; pageIndex: number; pageSize: number; db: Database }) {
  // TODO: extract this logic to a tested function
  // when searchquery is a single word, we append a wildcard to it to make it a prefix search
  const cleanedSearchQuery = searchQuery.replace(/"/g, '').replace(/\*/g, '').trim();
  const formattedSearchQuery = cleanedSearchQuery.includes(' ') ? cleanedSearchQuery : `${cleanedSearchQuery}*`;

  const result = await db.run(sql`
    SELECT * FROM ${documentsTable}
    JOIN documents_fts ON documents_fts.id = ${documentsTable.id}
    WHERE ${documentsTable.organizationId} = ${organizationId}
          AND ${documentsTable.isDeleted} = 0
          AND documents_fts MATCH ${formattedSearchQuery}
    ORDER BY rank
    LIMIT ${pageSize}
    OFFSET ${pageIndex * pageSize}
  `);

  return {
    documents: result.rows as unknown as (typeof documentsTable.$inferSelect)[],
  };
}
