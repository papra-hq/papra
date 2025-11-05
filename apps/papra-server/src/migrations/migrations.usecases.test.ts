import type { DatabaseClient } from '../modules/app/database/database.types';
import type { Migration } from './migrations.types';
import { createNoopLogger } from '@crowlog/logger';
import { sql } from 'kysely';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../modules/app/database/database';
import { rollbackLastAppliedMigration, runMigrations } from './migrations.usecases';

const createTableUserMigration: Migration = {
  name: 'create-table-user',
  up: async ({ db }) => {
    await db.schema
      .createTable('users')
      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
      .addColumn('name', 'text', col => col.notNull())
      .execute();
  },
  down: async ({ db }) => {
    await db.schema
      .dropTable('users')
      .execute();
  },
};

const createTableOrganizationMigration: Migration = {
  name: 'create-table-organization',
  up: async ({ db }) => {
    await db.schema
      .createTable('organizations')
      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
      .addColumn('name', 'text', col => col.notNull())
      .execute();

    await db.schema
      .createTable('organization_members')
      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
      .addColumn('organization_id', 'integer', col => col.notNull())
      .addColumn('user_id', 'integer', col => col.notNull())
      .addColumn('role', 'text', col => col.notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .execute();
  },
  down: async ({ db }) => {
    await db.schema
      .dropTable('organization_members')
      .execute();

    await db.schema
      .dropTable('organizations')
      .execute();
  },
};

const createTableDocumentMigration: Migration = {
  name: 'create-table-document',
  up: async ({ db }) => {
    await db.schema
      .createTable('documents')
      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .execute();
  },
  down: async ({ db }) => {
    await db.schema
      .dropTable('documents')
      .execute();
  },
};

async function getTablesNames({ db }: { db: DatabaseClient }) {
  const { rows: tables } = await db.executeQuery<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'`.compile(db));
  return tables.map(({ name }) => name);
}

describe('migrations usecases', () => {
  describe('runMigrations', () => {
    test('should run all migrations that are not already applied', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      const migrations = [createTableUserMigration, createTableOrganizationMigration];

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      const migrationsInDb = await db.selectFrom('migrations').selectAll().execute();

      expect(migrationsInDb.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
        { id: 2, name: 'create-table-organization' },
      ]);

      migrations.push(createTableDocumentMigration);

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      const migrationsInDb2 = await db.selectFrom('migrations').selectAll().execute();

      expect(migrationsInDb2.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
        { id: 2, name: 'create-table-organization' },
        { id: 3, name: 'create-table-document' },
      ]);

      // Ensure all tables and indexes are created
      expect(await getTablesNames({ db })).to.eql([
        'migrations',
        'migrations_name_index',
        'migrations_run_at_index',
        'users',
        'organizations',
        'organization_members',
        'documents',
      ]);
    });
  });

  describe('rollbackLastAppliedMigration', () => {
    test('the last migration down is called', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      const migrations = [createTableUserMigration, createTableDocumentMigration];

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      const initialMigrations = await db.selectFrom('migrations').selectAll().execute();

      expect(initialMigrations.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
        { id: 2, name: 'create-table-document' },
      ]);

      // Ensure the tables exists, no error is thrown
      await db.selectFrom('users').selectAll().execute();
      await db.selectFrom('documents').selectAll().execute();

      await rollbackLastAppliedMigration({ db, migrations });

      const migrationsInDb = await db.selectFrom('migrations').selectAll().execute();

      expect(migrationsInDb.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
      ]);

      // Ensure the table document is dropped
      await db.selectFrom('users').selectAll().execute();
      await expect(
        db.selectFrom('documents').selectAll().execute(),
      ).rejects.toThrow();
    });

    test('when their is no migration to rollback, nothing is done', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await rollbackLastAppliedMigration({ db });

      const migrationsInDb = await db.selectFrom('migrations').selectAll().execute();

      expect(migrationsInDb).to.eql([]);
    });

    test('when the last migration in the database does not exist in the migrations list, an error is thrown', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations: [createTableUserMigration], logger: createNoopLogger() });

      await expect(
        rollbackLastAppliedMigration({ db, migrations: [] }),
      ).rejects.toThrow('Migration create-table-user not found');
    });
  });
});
