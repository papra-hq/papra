import type { LibSQLDatabase } from 'drizzle-orm/libsql';

export type Database = LibSQLDatabase<Record<string, never>>;
