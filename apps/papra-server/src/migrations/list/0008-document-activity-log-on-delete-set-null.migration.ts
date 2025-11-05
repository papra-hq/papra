import type { Migration } from '../migrations.types';
import { sql } from 'kysely';

export const documentActivityLogOnDeleteSetNullMigration = {
  name: 'document-activity-log-on-delete-set-null',

  up: async ({ db }) => {
    // SQLite doesn't support modifying foreign keys, need to recreate table
    await db.executeQuery(sql`PRAGMA foreign_keys=OFF`.compile(db));

    await db.schema
      .createTable('__new_document_activity_log')
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('document_id', 'text', col => col.notNull().references('documents.id').onUpdate('cascade').onDelete('cascade'))
      .addColumn('event', 'text', col => col.notNull())
      .addColumn('event_data', 'text')
      .addColumn('user_id', 'text', col => col.references('users.id').onUpdate('cascade').onDelete('set null'))
      .addColumn('tag_id', 'text', col => col.references('tags.id').onUpdate('cascade').onDelete('set null'))
      .execute();

    await db.executeQuery(sql`
      INSERT INTO "__new_document_activity_log"("id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id")
      SELECT "id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id" FROM "document_activity_log"
    `.compile(db));

    await db
      .schema
      .dropTable('document_activity_log')
      .ifExists()
      .execute();

    await db
      .schema
      .alterTable('__new_document_activity_log')
      .renameTo('document_activity_log')
      .execute();

    await db.executeQuery(sql`PRAGMA foreign_keys=ON`.compile(db));
  },

  down: async ({ db }) => {
    await db.executeQuery(sql`PRAGMA foreign_keys=OFF`.compile(db));

    await db.schema
      .createTable('__restore_document_activity_log')
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('document_id', 'text', col => col.notNull().references('documents.id').onUpdate('cascade').onDelete('cascade'))
      .addColumn('event', 'text', col => col.notNull())
      .addColumn('event_data', 'text')
      .addColumn('user_id', 'text', col => col.references('users.id').onUpdate('cascade').onDelete('no action'))
      .addColumn('tag_id', 'text', col => col.references('tags.id').onUpdate('cascade').onDelete('no action'))
      .execute();

    await db.executeQuery(sql`
      INSERT INTO "__restore_document_activity_log"("id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id")
      SELECT "id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id" FROM "document_activity_log"
    `.compile(db));

    await db
      .schema
      .dropTable('document_activity_log')
      .ifExists()
      .execute();

    await db
      .schema
      .alterTable('__restore_document_activity_log')
      .renameTo('document_activity_log')
      .execute();

    await db.executeQuery(sql`PRAGMA foreign_keys=ON`.compile(db));
  },
} satisfies Migration;
