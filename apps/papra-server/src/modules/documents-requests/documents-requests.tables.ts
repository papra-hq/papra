import type { DocumentsRequestAccessLevel } from './documents-requests.types';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { tagsTable } from '../tags/tags.table';
import { usersTable } from '../users/users.table';
import { DOCUMENTS_REQUESTS_FILE_TAGS_ID_PREFIX, DOCUMENTS_REQUESTS_FILES_ID_PREFIX, DOCUMENTS_REQUESTS_ID_PREFIX } from './documents-requests.constants';

export const documentsRequestsTable = sqliteTable('documents_requests', {
  ...createPrimaryKeyField({ prefix: DOCUMENTS_REQUESTS_ID_PREFIX }),
  ...createTimestampColumns(),

  token: text('token').notNull().unique(),
  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdBy: text('created_by').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),

  useLimit: integer('use_limit').default(1), // null means unlimited
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  accessLevel: text('access_level').notNull().$type<DocumentsRequestAccessLevel>().default('organization_members'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

// To store the files that are allowed to be uploaded to the documents request
export const documentsRequestsFilesTable = sqliteTable('documents_requests_files', {
  ...createPrimaryKeyField({ prefix: DOCUMENTS_REQUESTS_FILES_ID_PREFIX }),
  ...createTimestampColumns(),

  documentsRequestId: text('documents_request_id').notNull().references(() => documentsRequestsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  allowedMimeTypes: text('allowed_mime_types', { mode: 'json' }).notNull().$type<string[]>().default(['*/*']),
  sizeLimit: integer('size_limit'), // null for no limit
});

export const documentsRequestsFileTagsTable = sqliteTable('documents_requests_file_tags', {
  ...createPrimaryKeyField({ prefix: DOCUMENTS_REQUESTS_FILE_TAGS_ID_PREFIX }),
  ...createTimestampColumns(),

  documentsRequestId: text('documents_request_id').notNull().references(() => documentsRequestsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  fileId: text('file_id').notNull().references(() => documentsRequestsFilesTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});
 