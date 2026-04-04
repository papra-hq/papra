import type { Database } from '../../../app/database/database.types';
import type { DocumentSearchableData } from '../document-search.types';
import { injectArguments } from '@corentinth/chisels';
import { desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { customPropertyDefinitionsTable } from '../../../custom-properties/custom-properties.table';
import { omitUndefined } from '../../../shared/objects';
import { documentsTable } from '../../documents.table';
import { makeSearchWhereClause } from './database-fts5.repository.models';
import { documentsFtsTable } from './database-fts5.tables';

export type DocumentSearchRepository = ReturnType<typeof createDocumentSearchRepository>;

export function createDocumentSearchRepository({ db }: { db: Database }) {
  return injectArguments({
    searchOrganizationDocuments,
    indexDocument,
    updateDocument,
    deleteDocument,
  }, { db });
}

async function searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize, db, now = new Date() }: { organizationId: string; searchQuery: string; pageIndex: number; pageSize: number; db: Database; now?: Date }) {
  const customPropertyDefinitions = await db
    .select()
    .from(customPropertyDefinitionsTable)
    .where(eq(customPropertyDefinitionsTable.organizationId, organizationId));

  const { searchWhereClause } = makeSearchWhereClause({ organizationId, query: searchQuery, db, now, customPropertyDefinitions });

  const paginatedIdsSubquery = db
    .selectDistinct({ id: documentsTable.id, createdAt: documentsTable.createdAt })
    .from(documentsTable)
    .where(searchWhereClause)
    .orderBy(desc(documentsTable.createdAt))
    .limit(pageSize)
    .offset(pageIndex * pageSize)
    .as('paginated_docs');

  const [totalCountResult, documents] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${documentsTable.id})` })
      .from(documentsTable)
      .where(searchWhereClause),

    db
      .select({
        ...omit(getTableColumns(documentsTable), ['content']),
      })
      .from(paginatedIdsSubquery)
      .innerJoin(documentsTable, eq(documentsTable.id, paginatedIdsSubquery.id))
      .orderBy(desc(paginatedIdsSubquery.createdAt)),
  ]);

  const documentsCount = totalCountResult[0]?.count ?? 0;

  return { documents, documentsCount };
}

async function indexDocument({ document, db }: { document: DocumentSearchableData; db: Database }) {
  await db
    .insert(documentsFtsTable)
    .values({
      documentId: document.id,
      organizationId: document.organizationId,
      name: document.name,
      content: document.content,
    });
}

async function updateDocument({ documentId, document, db }: { documentId: string; document: { content?: string; name?: string; originalName?: string }; db: Database }) {
  const dataToUpdate = omitUndefined({
    name: document.name,
    originalName: document.originalName,
    content: document.content,
  });

  if (Object.keys(dataToUpdate).length === 0) {
    return;
  }

  await db
    .update(documentsFtsTable)
    .set(dataToUpdate)
    .where(eq(documentsFtsTable.documentId, documentId));
}

async function deleteDocument({ documentId, db }: { documentId: string; db: Database }) {
  await db
    .delete(documentsFtsTable)
    .where(eq(documentsFtsTable.documentId, documentId));
}
