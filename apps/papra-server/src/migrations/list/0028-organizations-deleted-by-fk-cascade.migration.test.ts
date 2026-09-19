import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../../modules/app/database/database';
import { initialSchemaSetupMigration } from './0001-initial-schema-setup.migration';
import { softDeleteOrganizationsMigration } from './0011-soft-delete-organizations.migration';
import { organizationsDeletedByFkCascadeMigration } from './0028-organizations-deleted-by-fk-cascade.migration';

describe('0028-organizations-deleted-by-fk-cascade migration', () => {
  describe('organizationsDeletedByFkCascadeMigration', () => {
    test('deleting the user referenced by organizations.deleted_by sets the column to null (on delete set null)', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });
      await softDeleteOrganizationsMigration.up({ db });
      await organizationsDeletedByFkCascadeMigration.up({ db });

      await db.batch([
        db.run(
          sql`INSERT INTO users (id, created_at, updated_at, email) VALUES ('usr_1', 0, 0, 'admin@example.com')`,
        ),
        db.run(
          sql`INSERT INTO organizations (id, created_at, updated_at, name, deleted_by, deleted_at) VALUES ('org_1', 0, 0, 'Org 1', 'usr_1', 0)`,
        ),
      ]);

      await db.run(sql`DELETE FROM users WHERE id = 'usr_1'`);

      const { rows } = await db.run(sql`SELECT deleted_by FROM organizations WHERE id = 'org_1'`);

      expect(rows).to.eql([{ deleted_by: null }]);
    });

    test('updating the id of the user referenced by organizations.deleted_by cascades to the reference (on update cascade)', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });
      await softDeleteOrganizationsMigration.up({ db });
      await organizationsDeletedByFkCascadeMigration.up({ db });

      await db.batch([
        db.run(
          sql`INSERT INTO users (id, created_at, updated_at, email) VALUES ('usr_1', 0, 0, 'admin@example.com')`,
        ),
        db.run(
          sql`INSERT INTO organizations (id, created_at, updated_at, name, deleted_by, deleted_at) VALUES ('org_1', 0, 0, 'Org 1', 'usr_1', 0)`,
        ),
      ]);

      await db.run(sql`UPDATE users SET id = 'usr_2' WHERE id = 'usr_1'`);

      const { rows } = await db.run(sql`SELECT deleted_by FROM organizations WHERE id = 'org_1'`);

      expect(rows).to.eql([{ deleted_by: 'usr_2' }]);
    });

    test('before this migration, the missing on-delete clause blocks deleting the referenced user entirely (regression guard)', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });
      await softDeleteOrganizationsMigration.up({ db });
      // organizationsDeletedByFkCascadeMigration is intentionally NOT applied here,
      // to demonstrate the bug this migration fixes.

      await db.run(sql`PRAGMA foreign_keys=ON`);

      await db.batch([
        db.run(
          sql`INSERT INTO users (id, created_at, updated_at, email) VALUES ('usr_1', 0, 0, 'admin@example.com')`,
        ),
        db.run(
          sql`INSERT INTO organizations (id, created_at, updated_at, name, deleted_by, deleted_at) VALUES ('org_1', 0, 0, 'Org 1', 'usr_1', 0)`,
        ),
      ]);

      // Without an explicit ON DELETE clause, SQLite defaults to "no action",
      // which (with foreign key enforcement on) rejects the delete outright
      // instead of nulling out the reference.
      await expect(db.run(sql`DELETE FROM users WHERE id = 'usr_1'`)).rejects.toThrow();

      const { rows } = await db.run(sql`SELECT deleted_by FROM organizations WHERE id = 'org_1'`);
      expect(rows).to.eql([{ deleted_by: 'usr_1' }]);
    });

    test('preserves existing organization rows and data during the rebuild', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });
      await softDeleteOrganizationsMigration.up({ db });

      await db.batch([
        db.run(
          sql`INSERT INTO users (id, created_at, updated_at, email) VALUES ('usr_1', 0, 0, 'admin@example.com')`,
        ),
        db.run(
          sql`INSERT INTO organizations (id, created_at, updated_at, name, customer_id) VALUES ('org_1', 1737936000000, 1737936000000, 'Org 1', 'cus_1')`,
        ),
        db.run(
          sql`INSERT INTO organizations (id, created_at, updated_at, name, deleted_by, deleted_at, scheduled_purge_at) VALUES ('org_2', 1737936000000, 1737936000000, 'Org 2', 'usr_1', 1737936000000, 1738540800000)`,
        ),
      ]);

      await organizationsDeletedByFkCascadeMigration.up({ db });

      const { rows } = await db.run(sql`SELECT * FROM organizations ORDER BY id`);

      expect(rows).to.eql([
        {
          id: 'org_1',
          created_at: 1737936000000,
          updated_at: 1737936000000,
          name: 'Org 1',
          customer_id: 'cus_1',
          deleted_by: null,
          deleted_at: null,
          scheduled_purge_at: null,
        },
        {
          id: 'org_2',
          created_at: 1737936000000,
          updated_at: 1737936000000,
          name: 'Org 2',
          customer_id: null,
          deleted_by: 'usr_1',
          deleted_at: 1737936000000,
          scheduled_purge_at: 1738540800000,
        },
      ]);
    });
  });
});
