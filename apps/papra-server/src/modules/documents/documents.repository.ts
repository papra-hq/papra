import type { Database } from '../app/database/database.types';
import type { DbInsertableDocument } from './documents.types';
import { injectArguments } from '@corentinth/chisels';
import { subDays } from 'date-fns';
import { and, count, desc, eq, getTableColumns, lt, sql } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { withPagination } from '../shared/db/pagination';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { documentsTable } from './documents.table';

export type DocumentsRepository = ReturnType<typeof createDocumentsRepository>;

export function createDocumentsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      saveOrganizationDocument,
      getOrganizationDocuments,
      getOrganizationDeletedDocuments,
      getDocumentById,
      softDeleteDocument,
      getOrganizationDocumentsCount,
      getOrganizationDeletedDocumentsCount,
      searchOrganizationDocuments,
      restoreDocument,
      hardDeleteDocument,
      getExpiredDeletedDocuments,
    },
    { db },
  );
}

async function saveOrganizationDocument({ db, ...documentToInsert }: { db: Database } & DbInsertableDocument) {
  const [document] = await db.insert(documentsTable).values(documentToInsert).returning();

  return { document };
}

async function getOrganizationDocumentsCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [{ documentsCount }] = await db
    .select({
      documentsCount: count(documentsTable.id),
    })
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, false),
      ),
    );

  return { documentsCount };
}

async function getOrganizationDeletedDocumentsCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [{ documentsCount }] = await db
    .select({
      documentsCount: count(documentsTable.id),
    })
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, true),
      ),
    );

  return { documentsCount };
}

async function getOrganizationDocuments({ organizationId, pageIndex, pageSize, db }: { organizationId: string; pageIndex: number; pageSize: number; db: Database }) {
  const query = db
    .select({
      document: omit(getTableColumns(documentsTable), ['content']),
      tag: getTableColumns(tagsTable),
    })
    .from(documentsTable)
    .leftJoin(documentsTagsTable, eq(documentsTable.id, documentsTagsTable.documentId))
    .leftJoin(tagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, false),
      ),
    );

  const documentsTagsQuery = withPagination(
    query.$dynamic(),
    {
      orderByColumn: desc(documentsTable.createdAt),
      pageIndex,
      pageSize,
    },
  );

  const documentsTags = await documentsTagsQuery;

  const groupedDocuments = documentsTags.reduce((acc, { document, tag }) => {
    if (!acc[document.id]) {
      acc[document.id] = {
        ...document,
        tags: [],
      };
    }

    if (tag) {
      acc[document.id].tags.push(tag);
    }

    return acc;
  }, {} as Record<string, Omit<typeof documentsTable.$inferSelect, 'content'> & { tags: typeof tagsTable.$inferSelect[] }>);

  return {
    documents: Object.values(groupedDocuments),
  };
}

async function getOrganizationDeletedDocuments({ organizationId, pageIndex, pageSize, db }: { organizationId: string; pageIndex: number; pageSize: number; db: Database }) {
  const query = db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, true),
      ),
    );

  const documents = await withPagination(
    query.$dynamic(),
    {
      orderByColumn: desc(documentsTable.deletedAt),
      pageIndex,
      pageSize,
    },
  );

  return {
    documents,
  };
}

async function getDocumentById({ documentId, db }: { documentId: string; db: Database }) {
  const [[document], tags] = await Promise.all([
    db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId)),
    db
      .select({
        ...getTableColumns(tagsTable),
      })
      .from(documentsTagsTable)
      .leftJoin(tagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
      .where(eq(documentsTagsTable.documentId, documentId)),
  ]);

  return {
    document: {
      ...document,
      tags,
    },
  };
}

async function softDeleteDocument({ documentId, userId, db, now = new Date() }: { documentId: string; userId: string; db: Database; now?: Date }) {
  await db
    .update(documentsTable)
    .set({
      isDeleted: true,
      deletedBy: userId,
      deletedAt: now,
    })
    .where(eq(documentsTable.id, documentId));
}

async function restoreDocument({ documentId, db }: { documentId: string; db: Database }) {
  await db
    .update(documentsTable)
    .set({
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
    })
    .where(eq(documentsTable.id, documentId));
}

async function hardDeleteDocument({ documentId, db }: { documentId: string; db: Database }) {
  await db.delete(documentsTable).where(eq(documentsTable.id, documentId));
}

async function getExpiredDeletedDocuments({ db, expirationDelayInDays, now = new Date() }: { db: Database; expirationDelayInDays: number; now?: Date }) {
  const expirationDate = subDays(now, expirationDelayInDays);

  const documents = await db.select({
    id: documentsTable.id,
  }).from(documentsTable).where(
    and(
      eq(documentsTable.isDeleted, true),
      lt(documentsTable.deletedAt, expirationDate),
    ),
  );

  return {
    documentIds: documents.map(document => document.id),
  };
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
