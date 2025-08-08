import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const documentActivityLogOnDeleteSetNullMigration = {
  name: 'document-activity-log-on-delete-set-null',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`PRAGMA foreign_keys=OFF`),
      db.run(sql`
        CREATE TABLE "__new_document_activity_log" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "document_id" text NOT NULL,
          "event" text NOT NULL,
          "event_data" text,
          "user_id" text,
          "tag_id" text,
          FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade,
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null,
          FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE set null
        );
      `),
      db.run(sql`
        INSERT INTO "__new_document_activity_log"("id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id") SELECT "id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id" FROM "document_activity_log";
      `),
      db.run(sql`DROP TABLE IF EXISTS "document_activity_log"`),
      db.run(sql`ALTER TABLE "__new_document_activity_log" RENAME TO "document_activity_log"`),
      db.run(sql`PRAGMA foreign_keys=ON`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`PRAGMA foreign_keys=OFF`),
      db.run(sql`
        CREATE TABLE "__restore_document_activity_log" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "document_id" text NOT NULL,
          "event" text NOT NULL,
          "event_data" text,
          "user_id" text,
          "tag_id" text,
          FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade,
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE no action,
          FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE no action
        );
      `),
      db.run(sql`INSERT INTO "__restore_document_activity_log"("id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id") SELECT "id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id" FROM "document_activity_log";`),
      db.run(sql`DROP TABLE IF EXISTS "document_activity_log"`),
      db.run(sql`ALTER TABLE "__restore_document_activity_log" RENAME TO "document_activity_log"`),
      db.run(sql`PRAGMA foreign_keys=ON`),
    ]);
  },
} satisfies Migration;
