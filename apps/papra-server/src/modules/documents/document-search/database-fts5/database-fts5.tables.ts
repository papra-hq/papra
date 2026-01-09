import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const documentsFtsTable = sqliteTable('documents_fts', {
  documentId: text('document_id').notNull(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  content: text('content').notNull(),
});
