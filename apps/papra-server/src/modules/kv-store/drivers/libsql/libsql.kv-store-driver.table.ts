import type { JsonSerializableValue } from '../../kv-store.types';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const kvStoreTable = sqliteTable('kv_store', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<JsonSerializableValue>().notNull(),
  // Expiry as epoch milliseconds; null means the entry never expires.
  expiresAt: integer('expires_at'),
});
