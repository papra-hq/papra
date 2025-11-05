import type { Migration} from '../migrations.types';

export const documentActivityLogMigration = {
  name: 'document-activity-log',

  up: async ({ db }) => {
    await db.schema
      .createTable('document_activity_log')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('document_id', 'text', col => col.notNull().references('documents.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('event', 'text', col => col.notNull())
      .addColumn('event_data', 'text')
      .addColumn('user_id', 'text', col => col.references('users.id').onDelete('no action').onUpdate('cascade'))
      .addColumn('tag_id', 'text', col => col.references('tags.id').onDelete('no action').onUpdate('cascade'))
      .execute();
  },

  down: async ({ db }) => {
    await db.schema.dropTable('document_activity_log').ifExists().execute();
  },
} satisfies Migration;
