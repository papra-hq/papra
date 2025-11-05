import type { NonEmptyArray } from '../../shared/types';
import type { DocumentActivityEvent } from './document-activity.types';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCreatedAtField, createPrimaryKeyField } from '../../shared/db/columns.helpers';
import { tagsTable } from '../../tags/tags.table';
import { documentsTable } from '../documents.table';
import { DOCUMENT_ACTIVITY_EVENT_LIST } from './document-activity.constants';

// Legacy stub for Drizzle schema - this file is no longer used in production
const usersTable = { id: '' } as any;

export const documentActivityLogTable = sqliteTable('document_activity_log', {
  ...createPrimaryKeyField({ prefix: 'doc_act' }),
  ...createCreatedAtField(),

  documentId: text('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  event: text('event', { enum: DOCUMENT_ACTIVITY_EVENT_LIST as NonEmptyArray<DocumentActivityEvent> }).notNull(),
  eventData: text('event_data', { mode: 'json' }).$type<Record<string, unknown>>(),

  userId: text('user_id').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  tagId: text('tag_id').references(() => tagsTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
});
