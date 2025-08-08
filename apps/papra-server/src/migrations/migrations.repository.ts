import type { Database } from '../modules/app/database/database.types';
import { asc, eq, sql } from 'drizzle-orm';
import { migrationsTable } from './migration.tables';

export async function setupMigrationTableIfNotExists({ db }: { db: Database }) {
  await db.batch([
    db.run(sql`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, run_at INTEGER NOT NULL)`),
    db.run(sql`CREATE INDEX IF NOT EXISTS migrations_name_index ON migrations (name)`),
    db.run(sql`CREATE INDEX IF NOT EXISTS migrations_run_at_index ON migrations (run_at)`),
  ]);
}

export async function getMigrations({ db }: { db: Database }) {
  const migrations = await db.select().from(migrationsTable).orderBy(asc(migrationsTable.runAt));

  return { migrations };
}

export async function saveMigration({ db, migrationName, now = new Date() }: { db: Database; migrationName: string; now?: Date }) {
  await db.insert(migrationsTable).values({ name: migrationName, runAt: now });
}

export async function deleteMigration({ db, migrationName }: { db: Database; migrationName: string }) {
  await db.delete(migrationsTable).where(eq(migrationsTable.name, migrationName));
}

export async function deleteAllMigrations({ db }: { db: Database }) {
  await db.delete(migrationsTable);
}
