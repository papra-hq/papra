import type { DatabaseClient } from '../modules/app/database/database.types';

export async function setupMigrationTableIfNotExists({ db }: { db: DatabaseClient }) {
  await db.schema
    .createTable('migrations')
    .ifNotExists()
    .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', col => col.notNull())
    .addColumn('run_at', 'integer', col => col.notNull())
    .execute();

  await db.schema
    .createIndex('migrations_name_index')
    .ifNotExists()
    .on('migrations')
    .columns(['name'])
    .execute();

  await db.schema
    .createIndex('migrations_run_at_index')
    .ifNotExists()
    .on('migrations')
    .columns(['run_at'])
    .execute();
}

export async function getMigrations({ db }: { db: DatabaseClient }) {
  const dbMigrations = await db.selectFrom('migrations').selectAll().orderBy('run_at', 'asc').execute();

  return {
    migrations: dbMigrations.map(migration => ({
      ...migration,
      runAt: new Date(migration.run_at),
    })),
  };
}

export async function saveMigration({ db, migrationName, now = new Date() }: { db: DatabaseClient; migrationName: string; now?: Date }) {
  await db
    .insertInto('migrations')
    .values({
      name: migrationName,
      run_at: now.getTime(),
    })
    .execute();
}

export async function deleteMigration({ db, migrationName }: { db: DatabaseClient; migrationName: string }) {
  await db.deleteFrom('migrations').where('name', '=', migrationName).execute();
}

export async function deleteAllMigrations({ db }: { db: DatabaseClient }) {
  await db.deleteFrom('migrations').execute();
}
