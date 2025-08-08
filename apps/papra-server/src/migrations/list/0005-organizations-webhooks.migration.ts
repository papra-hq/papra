import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const organizationsWebhooksMigration = {
  name: 'organizations-webhooks',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "webhook_id" text NOT NULL,
          "event_name" text NOT NULL,
          "request_payload" text NOT NULL,
          "response_payload" text NOT NULL,
          "response_status" integer NOT NULL,
          FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "webhook_events" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "webhook_id" text NOT NULL,
          "event_name" text NOT NULL,
          FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),

      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_webhook_id_event_name_unique" ON "webhook_events" ("webhook_id","event_name")`),

      db.run(sql`
        CREATE TABLE IF NOT EXISTS "webhooks" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "name" text NOT NULL,
        "url" text NOT NULL,
        "secret" text,
        "enabled" integer DEFAULT true NOT NULL,
        "created_by" text,
        "organization_id" text,
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
      );  
      `),

    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS "webhook_deliveries"`),
      db.run(sql`DROP TABLE IF EXISTS "webhook_events"`),
      db.run(sql`DROP INDEX IF EXISTS "webhook_events_webhook_id_event_name_unique"`),
      db.run(sql`DROP TABLE IF EXISTS "webhooks"`),
    ]);
  },
} satisfies Migration;
