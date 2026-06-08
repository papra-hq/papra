import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { documentsTable } from '../documents/documents.table';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import { generateShareLinkId } from './document-share-links.models';

export const documentShareLinksTable = sqliteTable(
  'document_share_links',
  {
    ...createPrimaryKeyField({ idGenerator: generateShareLinkId }),
    ...createTimestampColumns(),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => documentsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdBy: text('created_by').references(() => usersTable.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    token: text('token').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    passwordHash: text('password_hash'),
    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    // Public lookup by token must be fast and tokens must be globally unique
    uniqueIndex('document_share_links_token_unique').on(table.token),
    // To list/manage share links for a given document within an organization
    index('document_share_links_organization_id_document_id_index').on(
      table.organizationId,
      table.documentId,
    ),
  ],
);
