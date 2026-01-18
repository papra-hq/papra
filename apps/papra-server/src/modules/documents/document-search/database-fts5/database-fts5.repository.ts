import type { Database } from '../../../app/database/database.types';
import type { Tag } from '../../../tags/tags.types';
import type { Document } from '../../documents.types';
import type { DocumentSearchableData } from '../document-search.types';
import { injectArguments } from '@corentinth/chisels';
import { desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { omitUndefined } from '../../../shared/utils';
import { documentsTagsTable, tagsTable } from '../../../tags/tags.table';
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

async function searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize, db }: { organizationId: string; searchQuery: string; pageIndex: number; pageSize: number; db: Database }) {
  const { searchWhereClause } = makeSearchWhereClause({ organizationId, query: searchQuery, db });

  const paginatedIdsSubquery = db
    .selectDistinct({ id: documentsTable.id, createdAt: documentsTable.createdAt })
    .from(documentsTable)
    .where(searchWhereClause)
    .orderBy(desc(documentsTable.createdAt))
    .limit(pageSize)
    .offset(pageIndex * pageSize)
    .as('paginated_docs');

  const [totalCountResult, documentsWithTags] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${documentsTable.id})` })
      .from(documentsTable)
      .where(searchWhereClause),

    db
      .selectDistinct({
        document: omit(getTableColumns(documentsTable), ['content']),
        tag: getTableColumns(tagsTable),
        _createdAt: paginatedIdsSubquery.createdAt,
      })
      .from(paginatedIdsSubquery)
      .innerJoin(documentsTable, eq(documentsTable.id, paginatedIdsSubquery.id))
      .leftJoin(documentsTagsTable, eq(documentsTable.id, documentsTagsTable.documentId))
      .leftJoin(tagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
      .orderBy(desc(paginatedIdsSubquery.createdAt)),
  ]);

  const totalCount = totalCountResult[0]?.count ?? 0;

  if (documentsWithTags.length === 0) {
    return { documents: [], totalCount };
  }

  const documentsMap = documentsWithTags.reduce(
    (acc, { document, tag }) => {
      if (!acc[document.id]) {
        acc[document.id] = { ...document, tags: [] };
      }

      if (tag) {
        acc[document.id]!.tags.push(tag);
      }

      return acc;
    },
    {} as Record<string, Omit<Document, 'content'> & { tags: Tag[] }>,
  );

  const documents = Object.values(documentsMap);

  return { documents, totalCount };
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
