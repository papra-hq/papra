import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { foldersTable } from '../folders/folders.table';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import { generateDocumentId } from './documents.models';

export const documentsTable = sqliteTable('documents', {
  ...createPrimaryKeyField({ idGenerator: generateDocumentId }),
  ...createTimestampColumns(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  // Null folderId means the document lives at the organization root.
  folderId: text('folder_id').references(() => foldersTable.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  createdBy: text('created_by').references(() => usersTable.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),

  originalName: text('original_name').notNull(),
  originalSize: integer('original_size').notNull().default(0),
  originalStorageKey: text('original_storage_key').notNull(),
  originalSha256Hash: text('original_sha256_hash').notNull(),

  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  content: text('content').notNull().default(''),
  documentDate: integer('document_date', { mode: 'timestamp_ms' }),
  notes: text('notes'),

  fileEncryptionKeyWrapped: text('file_encryption_key_wrapped'), // The wrapped encryption key
  fileEncryptionKekVersion: text('file_encryption_kek_version'), // The key encryption key version used to encrypt the file encryption key
  fileEncryptionAlgorithm: text('file_encryption_algorithm'),

  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  deletedBy: text('deleted_by').references(() => usersTable.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
});
