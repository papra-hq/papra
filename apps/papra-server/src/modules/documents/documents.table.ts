import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createSoftDeleteColumns, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import { generateDocumentId } from './documents.models';

export const documentsTable = sqliteTable('documents', {
  ...createPrimaryKeyField({ idGenerator: generateDocumentId }),
  ...createTimestampColumns(),
  ...createSoftDeleteColumns(),

  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdBy: text('created_by').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  deletedBy: text('deleted_by').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),

  originalName: text('original_name').notNull(),
  originalSize: integer('original_size').notNull().default(0),
  originalStorageKey: text('original_storage_key').notNull(),

  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  content: text('content').notNull().default(''),
}, table => [
  // To select paginated documents by organization
  index('documents_organization_id_is_deleted_created_at_index').on(table.organizationId, table.isDeleted, table.createdAt),
  // To count/stats documents by organization
  index('documents_organization_id_is_deleted_index').on(table.organizationId, table.isDeleted),
]);
