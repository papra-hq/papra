import type { Database } from '../../app/database/database.types';
import type { DocumentActivityEvent } from './document-activity.types';
import { injectArguments } from '@corentinth/chisels';
import { and, desc, eq, getTableColumns } from 'drizzle-orm';
import { withPagination } from '../../shared/db/pagination';
import { tagsTable } from '../../tags/tags.table';
import { usersTable } from '../../users/users.table';
import { documentsTable } from '../documents.table';
import { documentActivityLogTable } from './document-activity.table';

export type DocumentActivityRepository = ReturnType<typeof createDocumentActivityRepository>;

export function createDocumentActivityRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      saveDocumentActivity,
      getOrganizationDocumentActivities,
    },
    { db },
  );
}

async function saveDocumentActivity({
  documentId,
  event,
  eventData,
  userId,
  tagId,
  db,
}: {
  documentId: string;
  event: DocumentActivityEvent;
  eventData?: Record<string, unknown>;
  userId?: string;
  tagId?: string;
  db: Database;
}) {
  const [activity] = await db
    .insert(documentActivityLogTable)
    .values({
      documentId,
      event,
      eventData,
      userId,
      tagId,
    })
    .returning();

  return { activity };
}

async function getOrganizationDocumentActivities({
  organizationId,
  documentId,
  pageIndex,
  pageSize,
  db,
}: {
  organizationId: string;
  documentId: string;
  pageIndex: number;
  pageSize: number;
  db: Database;
}) {
  const query = db
    .select({
      ...getTableColumns(documentActivityLogTable),
      user: {
        id: usersTable.id,
        name: usersTable.name,
      },
      tag: {
        id: tagsTable.id,
        name: tagsTable.name,
        color: tagsTable.color,
        description: tagsTable.description,
      },
    })
    .from(documentActivityLogTable)
    // Join with documents table to ensure the document exists in the organization
    .innerJoin(documentsTable, eq(documentActivityLogTable.documentId, documentsTable.id))
    .leftJoin(usersTable, eq(documentActivityLogTable.userId, usersTable.id))
    .leftJoin(tagsTable, eq(documentActivityLogTable.tagId, tagsTable.id))
    .where(
      and(
        eq(documentsTable.organizationId, organizationId),
        eq(documentActivityLogTable.documentId, documentId),
      ),
    );

  const activities = await withPagination(
    query.$dynamic(),
    {
      orderByColumn: desc(documentActivityLogTable.createdAt),
      pageIndex,
      pageSize,
    },
  );

  return { activities };
}
