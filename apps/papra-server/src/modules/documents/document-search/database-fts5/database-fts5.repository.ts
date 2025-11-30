import type { Database } from '../../../app/database/database.types';
import type { DocumentSearchableData } from '../document-search.types';
import { injectArguments } from '@corentinth/chisels';
import { sql } from 'drizzle-orm';
import { documentsTable } from '../../documents.table';

export type DocumentSearchRepository = ReturnType<typeof createDocumentSearchRepository>;

export function createDocumentSearchRepository({ db }: { db: Database }) {
  return injectArguments({
    searchOrganizationDocuments,
    indexDocument,
    updateDocument,
    deleteDocument,
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

async function indexDocument({ document, db }: { document: DocumentSearchableData; db: Database }) {
  await db.run(sql`
    INSERT INTO documents_fts(id, name, original_name, content)
    VALUES (${document.id}, ${document.name}, ${document.originalName}, ${document.content})
  `);
}

async function updateDocument({ document, db }: { document: DocumentSearchableData; db: Database }) {
  await db.run(sql`
    UPDATE documents_fts
    SET name = ${document.name}, original_name = ${document.originalName}, content = ${document.content}
    WHERE id = ${document.id}
  `);
}

async function deleteDocument({ documentId, db }: { documentId: string; db: Database }) {
  await db.run(sql`
    DELETE FROM documents_fts
    WHERE id = ${documentId}
  `);
}
