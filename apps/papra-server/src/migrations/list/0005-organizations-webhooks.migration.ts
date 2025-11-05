import type { Migration } from '../migrations.types';

export const organizationsWebhooksMigration = {
  name: 'organizations-webhooks',

  up: async ({ db }) => {
    // Create webhooks table first
    await db.schema
      .createTable('webhooks')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('url', 'text', col => col.notNull())
      .addColumn('secret', 'text')
      .addColumn('enabled', 'integer', col => col.notNull().defaultTo(1))
      .addColumn('created_by', 'text', col => col.references('users.id').onDelete('set null').onUpdate('cascade'))
      .addColumn('organization_id', 'text', col => col.references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .execute();

    // Create webhook_events table (depends on webhooks)
    await db.schema
      .createTable('webhook_events')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('webhook_id', 'text', col => col.notNull().references('webhooks.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('event_name', 'text', col => col.notNull())
      .execute();

    await db.schema
      .createIndex('webhook_events_webhook_id_event_name_unique')
      .unique()
      .ifNotExists()
      .on('webhook_events')
      .columns(['webhook_id', 'event_name'])
      .execute();

    // Create webhook_deliveries table (depends on webhooks)
    await db.schema
      .createTable('webhook_deliveries')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('webhook_id', 'text', col => col.notNull().references('webhooks.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('event_name', 'text', col => col.notNull())
      .addColumn('request_payload', 'text', col => col.notNull())
      .addColumn('response_payload', 'text', col => col.notNull())
      .addColumn('response_status', 'integer', col => col.notNull())
      .execute();
  },

  down: async ({ db }) => {
    await db.schema.dropTable('webhook_deliveries').ifExists().execute();
    await db.schema.dropTable('webhook_events').ifExists().execute();
    await db.schema.dropTable('webhooks').ifExists().execute();
  },
} satisfies Migration;
