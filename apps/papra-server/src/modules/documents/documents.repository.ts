import type { Database } from '../app/database/database.types';
import type { DbInsertableDocument } from './documents.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, count, desc, eq, getTableColumns, lt, sql } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { createIterator } from '../app/database/database.usecases';
import { createOrganizationNotFoundError } from '../organizations/organizations.errors';
import { subDays } from '../shared/date';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { withPagination } from '../shared/db/pagination';
import { createError } from '../shared/errors/errors';
import { isDefined, isNil, omitUndefined } from '../shared/utils';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { createDocumentAlreadyExistsError, createDocumentNotFoundError } from './documents.errors';
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
      restoreDocument,
      hardDeleteDocument,
      getExpiredDeletedDocuments,
      getOrganizationStats,
      getOrganizationDocumentBySha256Hash,
      getAllOrganizationTrashDocuments,
      getAllOrganizationDocuments,
      getAllOrganizationDocumentsIterator,
      getAllOrganizationUndeletedDocumentsIterator,
      updateDocument,
      getGlobalDocumentsStats,
    },
    { db },
  );
}

async function getOrganizationDocumentBySha256Hash({ sha256Hash, organizationId, db }: { sha256Hash: string; organizationId: string; db: Database }) {
  const [document] = await db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.originalSha256Hash, sha256Hash),
        eq(documentsTable.organizationId, organizationId),
      ),
    );

  return { document };
}

async function saveOrganizationDocument({ db, ...documentToInsert }: { db: Database } & DbInsertableDocument) {
  const [documents, error] = await safely(db.insert(documentsTable).values(documentToInsert).returning());

  if (isUniqueConstraintError({ error })) {
    throw createDocumentAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [document] = documents ?? [];

  if (isNil(document)) {
    // Very unlikely to happen as the insertion throws an issue, it's for type safety
    throw createError({
      message: 'Error while saving document',
      code: 'documents.save_error',
      statusCode: 500,
      isInternal: true,
    });
  }

  return { document };
}

async function getOrganizationDocumentsCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [record] = await db
    .select({
      documentsCount: count(documentsTable.id),
    })
    .from(documentsTable)
    .leftJoin(documentsTagsTable, eq(documentsTable.id, documentsTagsTable.documentId))
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, false),
      ),
    );

  if (isNil(record)) {
    throw createOrganizationNotFoundError();
  }

  const { documentsCount } = record;

  return { documentsCount };
}

async function getOrganizationDeletedDocumentsCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [record] = await db
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

  if (isNil(record)) {
    throw createOrganizationNotFoundError();
  }

  const { documentsCount } = record;

  return { documentsCount };
}

async function getOrganizationDocuments({
  organizationId,
  pageIndex,
  pageSize,
  db,
}: {
  organizationId: string;
  pageIndex: number;
  pageSize: number;
  db: Database;
}) {
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
      acc[document.id]!.tags.push(tag);
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

async function getDocumentById({ documentId, organizationId, db }: { documentId: string; organizationId: string; db: Database }) {
  const [document] = await db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.id, documentId),
        eq(documentsTable.organizationId, organizationId),
      ),
    );

  if (!document) {
    return { document: undefined };
  }

  const tags = await db
    .select({
      ...getTableColumns(tagsTable),
    })
    .from(documentsTagsTable)
    .leftJoin(tagsTable, eq(tagsTable.id, documentsTagsTable.tagId))
    .where(eq(documentsTagsTable.documentId, documentId));

  return {
    document: {
      ...document,
      tags,
    },
  };
}

async function softDeleteDocument({ documentId, organizationId, userId, db, now = new Date() }: { documentId: string; organizationId: string; userId: string; db: Database; now?: Date }) {
  await db
    .update(documentsTable)
    .set({
      isDeleted: true,
      deletedBy: userId,
      deletedAt: now,
    })
    .where(
      and(
        eq(documentsTable.id, documentId),
        eq(documentsTable.organizationId, organizationId),
      ),
    );
}

async function restoreDocument({ documentId, organizationId, name, userId, db }: { documentId: string; organizationId: string; name?: string; userId?: string; db: Database }) {
  const [document] = await db
    .update(documentsTable)
    .set({
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
      ...(isDefined(name) ? { name, originalName: name } : {}),
      ...(isDefined(userId) ? { createdBy: userId } : {}),
    })
    .where(
      and(
        eq(documentsTable.id, documentId),
        eq(documentsTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (isNil(document)) {
    throw createDocumentNotFoundError();
  }

  return { document };
}

async function hardDeleteDocument({ documentId, db }: { documentId: string; db: Database }) {
  await db.delete(documentsTable).where(eq(documentsTable.id, documentId));
}

async function getExpiredDeletedDocuments({ db, expirationDelayInDays, now = new Date() }: { db: Database; expirationDelayInDays: number; now?: Date }) {
  const expirationDate = subDays(now, expirationDelayInDays);

  const documents = await db.select({
    id: documentsTable.id,
    originalStorageKey: documentsTable.originalStorageKey,
    organizationId: documentsTable.organizationId,
  }).from(documentsTable).where(
    and(
      eq(documentsTable.isDeleted, true),
      lt(documentsTable.deletedAt, expirationDate),
    ),
  );

  return {
    documents,
  };
}

async function getOrganizationStats({ organizationId, db }: { organizationId: string; db: Database }) {
  const [record] = await db
    .select({
      totalDocumentsCount: count(documentsTable.id),
      totalDocumentsSize: sql<number>`COALESCE(SUM(${documentsTable.originalSize}), 0)`.as('totalDocumentsSize'),
      deletedDocumentsCount: sql<number>`COUNT(${documentsTable.id}) FILTER (WHERE ${documentsTable.isDeleted} = true)`.as('deletedDocumentsCount'),
      documentsCount: sql<number>`COUNT(${documentsTable.id}) FILTER (WHERE ${documentsTable.isDeleted} = false)`.as('documentsCount'),
      documentsSize: sql<number>`COALESCE(SUM(${documentsTable.originalSize}) FILTER (WHERE ${documentsTable.isDeleted} = false), 0)`.as('documentsSize'),
      deletedDocumentsSize: sql<number>`COALESCE(SUM(${documentsTable.originalSize}) FILTER (WHERE ${documentsTable.isDeleted} = true), 0)`.as('deletedDocumentsSize'),
    })
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
      ),
    );

  if (isNil(record)) {
    throw createOrganizationNotFoundError();
  }

  const { documentsCount, documentsSize, deletedDocumentsCount, deletedDocumentsSize, totalDocumentsCount, totalDocumentsSize } = record;

  return {
    documentsCount,
    documentsSize: Number(documentsSize ?? 0),
    deletedDocumentsCount,
    deletedDocumentsSize,
    totalDocumentsCount,
    totalDocumentsSize,
  };
}

async function getAllOrganizationTrashDocuments({ organizationId, db }: { organizationId: string; db: Database }) {
  const documents = await db.select({
    id: documentsTable.id,
    originalStorageKey: documentsTable.originalStorageKey,
    organizationId: documentsTable.organizationId,
  }).from(documentsTable).where(
    and(
      eq(documentsTable.organizationId, organizationId),
      eq(documentsTable.isDeleted, true),
    ),
  );

  return {
    documents,
  };
}

async function getAllOrganizationDocuments({ organizationId, db }: { organizationId: string; db: Database }) {
  const documents = await db.select({
    id: documentsTable.id,
    originalStorageKey: documentsTable.originalStorageKey,
  }).from(documentsTable).where(
    eq(documentsTable.organizationId, organizationId),
  );

  return {
    documents,
  };
}

function getAllOrganizationDocumentsIterator({ organizationId, batchSize = 100, db }: { organizationId: string; batchSize?: number; db: Database }) {
  const query = db
    .select({
      id: documentsTable.id,
      originalStorageKey: documentsTable.originalStorageKey,
    })
    .from(documentsTable)
    .where(
      eq(documentsTable.organizationId, organizationId),
    )
    .orderBy(documentsTable.createdAt)
    .$dynamic();

  return createIterator({ query, batchSize }) as AsyncGenerator<{ id: string; originalStorageKey: string }>;
}

function getAllOrganizationUndeletedDocumentsIterator({ organizationId, batchSize = 100, db }: { organizationId: string; batchSize?: number; db: Database }) {
  const query = db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, false),
      ),
    )
    .orderBy(documentsTable.createdAt)
    .$dynamic();

  return createIterator({ query, batchSize });
}

async function updateDocument({ documentId, organizationId, name, content, db }: { documentId: string; organizationId: string; name?: string; content?: string; db: Database }) {
  const [document] = await db
    .update(documentsTable)
    .set(omitUndefined({ name, content }))
    .where(
      and(
        eq(documentsTable.id, documentId),
        eq(documentsTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (isNil(document)) {
    throw createDocumentNotFoundError();
  }

  return { document };
}

async function getGlobalDocumentsStats({ db }: { db: Database }) {
  const [record] = await db
    .select({
      totalDocumentsCount: count(documentsTable.id),
      totalDocumentsSize: sql<number>`COALESCE(SUM(${documentsTable.originalSize}), 0)`.as('totalDocumentsSize'),
      deletedDocumentsCount: sql<number>`COUNT(${documentsTable.id}) FILTER (WHERE ${documentsTable.isDeleted} = true)`.as('deletedDocumentsCount'),
      documentsCount: sql<number>`COUNT(${documentsTable.id}) FILTER (WHERE ${documentsTable.isDeleted} = false)`.as('documentsCount'),
      documentsSize: sql<number>`COALESCE(SUM(${documentsTable.originalSize}) FILTER (WHERE ${documentsTable.isDeleted} = false), 0)`.as('documentsSize'),
      deletedDocumentsSize: sql<number>`COALESCE(SUM(${documentsTable.originalSize}) FILTER (WHERE ${documentsTable.isDeleted} = true), 0)`.as('deletedDocumentsSize'),
    })
    .from(documentsTable);

  if (isNil(record)) {
    return {
      documentsCount: 0,
      documentsSize: 0,
      deletedDocumentsCount: 0,
      deletedDocumentsSize: 0,
      totalDocumentsCount: 0,
      totalDocumentsSize: 0,
    };
  }

  const { documentsCount, documentsSize, deletedDocumentsCount, deletedDocumentsSize, totalDocumentsCount, totalDocumentsSize } = record;

  return {
    documentsCount,
    documentsSize: Number(documentsSize ?? 0),
    deletedDocumentsCount,
    deletedDocumentsSize: Number(deletedDocumentsSize ?? 0),
    totalDocumentsCount,
    totalDocumentsSize: Number(totalDocumentsSize ?? 0),
  };
}
