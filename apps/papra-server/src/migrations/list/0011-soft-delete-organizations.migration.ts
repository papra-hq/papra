import type { Migration } from '../migrations.types';
import { sql } from 'kysely';

export const softDeleteOrganizationsMigration = {
  name: 'soft-delete-organizations',

  up: async ({ db }) => {
    const tableInfo = await db.executeQuery<{ name: string }>(sql`PRAGMA table_info(organizations)`.compile(db));
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('deleted_by')) {
      await db.schema
        .alterTable('organizations')
        .addColumn('deleted_by', 'text', col => col.references('users.id').onDelete('set null').onUpdate('cascade'))
        .execute();
    }

    if (!hasColumn('deleted_at')) {
      await db.schema
        .alterTable('organizations')
        .addColumn('deleted_at', 'integer')
        .execute();
    }

    if (!hasColumn('scheduled_purge_at')) {
      await db.schema
        .alterTable('organizations')
        .addColumn('scheduled_purge_at', 'integer')
        .execute();
    }

    await db.schema
      .createIndex('organizations_deleted_at_purge_at_index')
      .ifNotExists()
      .on('organizations')
      .columns(['deleted_at', 'scheduled_purge_at'])
      .execute();

    await db.schema
      .createIndex('organizations_deleted_by_deleted_at_index')
      .ifNotExists()
      .on('organizations')
      .columns(['deleted_by', 'deleted_at'])
      .execute();
  },

  down: async ({ db }) => {
    await db.schema.dropIndex('organizations_deleted_at_purge_at_index').ifExists().execute();
    await db.schema.dropIndex('organizations_deleted_by_deleted_at_index').ifExists().execute();

    await db.schema.alterTable('organizations').dropColumn('deleted_by').execute();
    await db.schema.alterTable('organizations').dropColumn('deleted_at').execute();
    await db.schema.alterTable('organizations').dropColumn('scheduled_purge_at').execute();
  },
} satisfies Migration;
