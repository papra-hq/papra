import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const documentsFtsTable = sqliteTable('documents_fts', {
  id: text('id').notNull(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  content: text('content').notNull(),
});
