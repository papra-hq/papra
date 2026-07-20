import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const backupsMigration = {
  name: 'backups',

  up: async ({ db }) => {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "backup_destinations" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "organization_id" text NOT NULL,
        "driver" text NOT NULL,
        "display_name" text NOT NULL,
        "settings_json" text NOT NULL DEFAULT '{}',
        "encrypted_credentials" text NOT NULL,
        "account_label" text,
        "wrapped_backup_key" text NOT NULL,
        "backup_key_algorithm" text NOT NULL,
        "remote_folder_ref" text,
        "is_schedule_enabled" integer NOT NULL DEFAULT false,
        "schedule_days_json" text NOT NULL DEFAULT '[]',
        "schedule_hour" integer,
        "schedule_minute" integer,
        "last_run_at" integer,
        "next_scheduled_at" integer,
        "is_enabled" integer NOT NULL DEFAULT true,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
      );
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "backup_destinations_organization_id_index" ON "backup_destinations" ("organization_id");
    `);
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "backup_destinations_next_scheduled_at_index" ON "backup_destinations" ("next_scheduled_at");
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS "backup_runs" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "destination_id" text NOT NULL,
        "organization_id" text NOT NULL,
        "trigger" text NOT NULL,
        "status" text NOT NULL,
        "remote_file_id" text,
        "remote_file_name" text,
        "documents_count" integer,
        "total_size_bytes" integer,
        "error_message" text,
        "completed_at" integer,
        FOREIGN KEY ("destination_id") REFERENCES "backup_destinations"("id") ON UPDATE cascade ON DELETE cascade,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
      );
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "backup_runs_destination_id_created_at_index" ON "backup_runs" ("destination_id", "created_at");
    `);
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS "backup_runs_status_index" ON "backup_runs" ("status");
    `);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "backup_runs"`);
    await db.run(sql`DROP TABLE IF EXISTS "backup_destinations"`);
  },
} satisfies Migration;
