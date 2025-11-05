import type { Migration } from '../migrations.types';

export const apiKeysMigration = {
  name: 'api-keys',

  up: async ({ db }) => {
    // Create api_keys table first (depends on users)
    await db.schema
      .createTable('api_keys')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('key_hash', 'text', col => col.notNull())
      .addColumn('prefix', 'text', col => col.notNull())
      .addColumn('user_id', 'text', col => col.notNull().references('users.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('last_used_at', 'integer')
      .addColumn('expires_at', 'integer')
      .addColumn('permissions', 'text', col => col.notNull().defaultTo('[]'))
      .addColumn('all_organizations', 'integer', col => col.notNull().defaultTo(0))
      .execute();

    await db.schema
      .createIndex('api_keys_key_hash_unique')
      .unique()
      .ifNotExists()
      .on('api_keys')
      .column('key_hash')
      .execute();

    await db.schema
      .createIndex('key_hash_index')
      .ifNotExists()
      .on('api_keys')
      .column('key_hash')
      .execute();

    // Create api_key_organizations junction table (depends on api_keys and organization_members)
    await db.schema
      .createTable('api_key_organizations')
      .ifNotExists()
      .addColumn('api_key_id', 'text', col => col.notNull().references('api_keys.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('organization_member_id', 'text', col => col.notNull().references('organization_members.id').onDelete('cascade').onUpdate('cascade'))
      .execute();
  },

  down: async ({ db }) => {
    await db.schema.dropTable('api_key_organizations').ifExists().execute();
    await db.schema.dropTable('api_keys').ifExists().execute();
  },
} satisfies Migration;
