import type { Database } from '../app/database/database.types';
import type { DbInsertableDocument } from './documents.types';
import { injectArguments } from '@corentinth/chisels';
import { and, count, desc, eq } from 'drizzle-orm';
import { withPagination } from '../shared/db/pagination';
import { documentsTable } from './documents.table';

export type DocumentsRepository = ReturnType<typeof createDocumentsRepository>;

export function createDocumentsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      saveOrganizationDocument,
      getOrganizationDocuments,
      getDocumentById,
      softDeleteDocument,
      getOrganizationDocumentsCount,
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
      documentsCount: count(),
    })
    .from(documentsTable)
    .where(
      eq(documentsTable.organizationId, organizationId),
    );

  return { documentsCount };
}

async function getOrganizationDocuments({ organizationId, pageIndex, pageSize, db }: { organizationId: string; pageIndex: number; pageSize: number; db: Database }) {
  const query = db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentsTable.isDeleted, false),
      ),
    );

  const documents = await withPagination(
    query.$dynamic(),
    {
      orderByColumn: desc(documentsTable.createdAt),
      pageIndex,
      pageSize,
    },
  );

  return {
    documents,
  };
}

async function getDocumentById({ documentId, db }: { documentId: string; db: Database }) {
  const [document] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, documentId));

  return {
    document,
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
