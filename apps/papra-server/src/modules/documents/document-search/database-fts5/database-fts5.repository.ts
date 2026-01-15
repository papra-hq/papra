import type { Database } from '../../../app/database/database.types';
import type { DocumentSearchableData } from '../document-search.types';
import { injectArguments } from '@corentinth/chisels';
import { asc, eq } from 'drizzle-orm';
import { omitUndefined } from '../../../shared/utils';
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

  const query = db.selectDistinct({
    id: documentsTable.id,
    organizationId: documentsTable.organizationId,
    name: documentsTable.name,
  })
    .from(documentsTable)
    .where(searchWhereClause)
    .orderBy(asc(documentsTable.createdAt))
    .limit(pageSize)
    .offset(pageIndex * pageSize);

  // console.log(query.toSQL());

  const documents = await query;

  return { documents };
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
