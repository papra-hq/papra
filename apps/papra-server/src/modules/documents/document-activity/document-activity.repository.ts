import type { DatabaseClient } from '../../app/database/database.types';
import type { DocumentActivityEvent } from './document-activity.types';
import { injectArguments } from '@corentinth/chisels';
import { dbToDocumentActivity, documentActivityToDb } from './document-activity.models';

export type DocumentActivityRepository = ReturnType<typeof createDocumentActivityRepository>;

export function createDocumentActivityRepository({ db }: { db: DatabaseClient }) {
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
  db: DatabaseClient;
}) {
  const dbActivity = await db
    .insertInto('document_activity_log')
    .values(documentActivityToDb({
      documentId,
      event,
      eventData,
      userId,
      tagId,
    }))
    .returningAll()
    .executeTakeFirst();

  return { activity: dbToDocumentActivity(dbActivity) };
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
  db: DatabaseClient;
}) {
  const activities = await db
    .selectFrom('document_activity_log')
    // Join with documents table to ensure the document exists in the organization
    .innerJoin('documents', 'document_activity_log.document_id', 'documents.id')
    .leftJoin('users', 'document_activity_log.user_id', 'users.id')
    .leftJoin('tags', 'document_activity_log.tag_id', 'tags.id')
    .where('documents.organization_id', '=', organizationId)
    .where('document_activity_log.document_id', '=', documentId)
    .select([
      'document_activity_log.id',
      'document_activity_log.document_id',
      'document_activity_log.event',
      'document_activity_log.event_data',
      'document_activity_log.user_id',
      'document_activity_log.tag_id',
      'document_activity_log.created_at',
      'users.id as user_id_ref',
      'users.name as user_name',
      'tags.id as tag_id_ref',
      'tags.name as tag_name',
      'tags.color as tag_color',
      'tags.description as tag_description',
    ])
    .orderBy('document_activity_log.created_at', 'desc')
    .limit(pageSize)
    .offset(pageIndex * pageSize)
    .execute();

  return { activities };
}
