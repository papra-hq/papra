import type { Migration } from './migrations.types';
import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../modules/app/database/database';
import { migrationsTable } from './migration.tables';
import { rollbackLastAppliedMigration, runMigrations } from './migrations.usecases';

const createTableUserMigration: Migration = {
  name: 'create-table-user',
  up: async ({ db }) => {
    await db.run(sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
  },
  down: async ({ db }) => {
    await db.run(sql`DROP TABLE users`);
  },
};

const createTableOrganizationMigration: Migration = {
  name: 'create-table-organization',
  up: async ({ db }) => {
    await db.batch([
      db.run(sql`CREATE TABLE organizations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`),
      db.run(sql`CREATE TABLE organization_members (id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    ]);
  },
  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE organizations`),
      db.run(sql`DROP TABLE organization_members`),
    ]);
  },
};

const createTableDocumentMigration: Migration = {
  name: 'create-table-document',
  up: async ({ db }) => {
    await db.batch([
      db.run(sql`CREATE TABLE documents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    ]);
  },
  down: async ({ db }) => {
    await db.run(sql`DROP TABLE documents`);
  },
};

describe('migrations usecases', () => {
  describe('runMigrations', () => {
    test('should run all migrations that are not already applied', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      const migrations = [createTableUserMigration, createTableOrganizationMigration];

      await runMigrations({ db, migrations });

      const migrationsInDb = await db.select().from(migrationsTable);

      expect(migrationsInDb.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
        { id: 2, name: 'create-table-organization' },
      ]);

      migrations.push(createTableDocumentMigration);

      await runMigrations({ db, migrations });

      const migrationsInDb2 = await db.select().from(migrationsTable);

      expect(migrationsInDb2.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
        { id: 2, name: 'create-table-organization' },
        { id: 3, name: 'create-table-document' },
      ]);

      const { rows: tables } = await db.run(sql`SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'`);

      // Ensure all tables and indexes are created
      expect(tables.map(t => t.name)).to.eql([
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

      await runMigrations({ db, migrations });

      const initialMigrations = await db.select().from(migrationsTable);

      expect(initialMigrations.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
        { id: 2, name: 'create-table-document' },
      ]);

      // Ensure the tables exists, no error is thrown
      await db.run(sql`SELECT * FROM users`);
      await db.run(sql`SELECT * FROM documents`);

      await rollbackLastAppliedMigration({ db, migrations });

      const migrationsInDb = await db.select().from(migrationsTable);

      expect(migrationsInDb.map(({ id, name }) => ({ id, name }))).to.eql([
        { id: 1, name: 'create-table-user' },
      ]);

      // Ensure the table document is dropped
      await db.run(sql`SELECT * FROM users`);
      await expect(db.run(sql`SELECT * FROM documents`)).rejects.toThrow();
    });

    test('when their is no migration to rollback, nothing is done', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await rollbackLastAppliedMigration({ db });

      const migrationsInDb = await db.select().from(migrationsTable);

      expect(migrationsInDb).to.eql([]);
    });

    test('when the last migration in the database does not exist in the migrations list, an error is thrown', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations: [createTableUserMigration] });

      await expect(
        rollbackLastAppliedMigration({ db, migrations: [] }),
      ).rejects.toThrow('Migration create-table-user not found');
    });
  });
});
