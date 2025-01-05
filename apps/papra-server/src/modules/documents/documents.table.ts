import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createSoftDeleteColumns, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';

export const documentsTable = sqliteTable('documents', {
  ...createPrimaryKeyField({ prefix: 'doc' }),
  ...createTimestampColumns(),
  ...createSoftDeleteColumns(),

  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdBy: text('created_by').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  deletedBy: text('deleted_by').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),

  originalName: text('original_name').notNull(),
  // originalChecksum: text('original_checksum').notNull(),
  originalSize: integer('original_size').notNull().default(0),
  storageKey: text('storage_key').notNull(),

  name: text('name').notNull(),
  // mimeType: text('mime_type').notNull(),
  size: integer('size').notNull().default(0),
  status: text('status').notNull().default('pending'),
  mimeType: text('mime_type').notNull(),
  content: text('content').notNull().default(''),
});
