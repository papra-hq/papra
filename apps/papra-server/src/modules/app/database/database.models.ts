import type { SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';

const sqliteDialect = new SQLiteSyncDialect();

export function stringifySqlQuery(queryBuilder?: SQL) {
  if (!queryBuilder) {
    return { query: '', params: [] };
  }

  const { sql: query, params } = sqliteDialect.sqlToQuery(queryBuilder);
  return { query, params };
}
