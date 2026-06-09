import type { Database } from '../../../app/database/database.types';
import type { DocumentSearchSort } from '../document-search.constants';
import type { DocumentSearchableData, DocumentUpdate } from '../document-search.types';
import { injectArguments } from '@corentinth/chisels';
import { eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { customPropertyDefinitionsTable } from '../../../custom-properties/custom-properties.table';
import { isNonEmptyArray } from '../../../shared/arrays/arrays.utils';
import { omit, omitUndefined } from '../../../shared/objects';
import { documentsTable } from '../../documents.table';
import { DEFAULT_DOCUMENT_SEARCH_SORT } from '../document-search.constants';
import { makeSearchOrderByClauses, makeSearchWhereClause } from './database-fts5.repository.models';
import { documentsFtsTable } from './database-fts5.tables';

export type DocumentSearchRepository = ReturnType<typeof createDocumentSearchRepository>;

export function createDocumentSearchRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      searchOrganizationDocuments,
      getDocumentIdsMatchingQuery,
      indexDocuments,
      updateDocuments,
      deleteDocuments,
    },
    { db },
  );
}

async function searchOrganizationDocuments({
  organizationId,
  searchQuery,
  pageIndex,
  pageSize,
  sort = DEFAULT_DOCUMENT_SEARCH_SORT,
  db,
  now = new Date(),
}: {
  organizationId: string;
  searchQuery: string;
  pageIndex: number;
  pageSize: number;
  sort?: DocumentSearchSort;
  db: Database;
  now?: Date;
}) {
  const customPropertyDefinitions = await db
    .select()
    .from(customPropertyDefinitionsTable)
    .where(eq(customPropertyDefinitionsTable.organizationId, organizationId));

  const { searchWhereClause } = makeSearchWhereClause({
    organizationId,
    query: searchQuery,
    db,
    now,
    customPropertyDefinitions,
  });
  const { orderByClauses, sortColumn } = makeSearchOrderByClauses({ sort });

  const paginatedIdsSubquery = db
    // selecting the sort value keeps it in the result set so the DISTINCT + ORDER BY of the paginated subquery stays unambiguous (the tag filters can otherwise produce duplicate rows per document)
    .selectDistinct({ id: documentsTable.id, sortValue: sql`${sortColumn}`.as('sort_value') })
    .from(documentsTable)
    .where(searchWhereClause)
    .orderBy(...orderByClauses)
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
      // re-apply the sort on the joined documents table so the collation of `sortColumn` is honoured here too
      .orderBy(...orderByClauses),
  ]);

  const documentsCount = totalCountResult[0]?.count ?? 0;

  return { documents, documentsCount };
}

async function getDocumentIdsMatchingQuery({
  organizationId,
  searchQuery,
  db,
  now = new Date(),
}: {
  organizationId: string;
  searchQuery: string;
  db: Database;
  now?: Date;
}) {
  const customPropertyDefinitions = await db
    .select()
    .from(customPropertyDefinitionsTable)
    .where(eq(customPropertyDefinitionsTable.organizationId, organizationId));

  const { searchWhereClause } = makeSearchWhereClause({
    organizationId,
    query: searchQuery,
    db,
    now,
    customPropertyDefinitions,
  });

  const rows = await db
    .selectDistinct({ id: documentsTable.id })
    .from(documentsTable)
    .where(searchWhereClause);

  return { documentIds: rows.map((row) => row.id) };
}

async function indexDocuments({
  documents,
  db,
}: {
  documents: DocumentSearchableData[];
  db: Database;
}) {
  if (documents.length === 0) {
    return;
  }

  await db.insert(documentsFtsTable).values(
    documents.map((document) => ({
      documentId: document.id,
      organizationId: document.organizationId,
      name: document.name,
      content: document.content,
    })),
  );
}

async function updateDocuments({ updates, db }: { updates: DocumentUpdate[]; db: Database }) {
  if (updates.length === 0) {
    return;
  }

  const queries = updates
    .map(({ documentId, document }) => {
      const dataToUpdate = omitUndefined({
        name: document.name,
        content: document.content,
      });

      if (Object.keys(dataToUpdate).length === 0) {
        return null;
      }

      return db
        .update(documentsFtsTable)
        .set(dataToUpdate)
        .where(eq(documentsFtsTable.documentId, documentId));
    })
    .filter((query) => query !== null);

  if (!isNonEmptyArray(queries)) {
    return;
  }

  await db.batch(queries);
}

async function deleteDocuments({ documentIds, db }: { documentIds: string[]; db: Database }) {
  if (documentIds.length === 0) {
    return;
  }

  await db.delete(documentsFtsTable).where(inArray(documentsFtsTable.documentId, documentIds));
}
