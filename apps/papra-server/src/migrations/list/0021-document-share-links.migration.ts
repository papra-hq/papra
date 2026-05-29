import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const documentShareLinksMigration = {
  name: 'document-share-links',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`CREATE TABLE IF NOT EXISTS "document_share_links" (
        "id" text PRIMARY KEY NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "organization_id" text NOT NULL,
        "document_id" text NOT NULL,
        "created_by" text,
        "token" text NOT NULL,
        "expires_at" integer,
        "password_hash" text,
        "is_enabled" integer DEFAULT true NOT NULL,
        "last_accessed_at" integer,
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
        FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade,
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null
      )`),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "document_share_links_token_unique" ON "document_share_links" ("token")`),
      db.run(sql`CREATE INDEX IF NOT EXISTS "document_share_links_organization_id_document_id_index" ON "document_share_links" ("organization_id", "document_id")`),
    ]);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "document_share_links"`);
  },
} satisfies Migration;
