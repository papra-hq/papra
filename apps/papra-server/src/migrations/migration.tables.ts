import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const migrationsTable = sqliteTable('migrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  runAt: integer('run_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => new Date()),
});
