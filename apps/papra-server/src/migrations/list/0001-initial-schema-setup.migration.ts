import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const initialSchemaSetupMigration = {
  name: 'initial-schema-setup',
  description: 'Creation of the base tables for the application',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "documents" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "is_deleted" integer DEFAULT false NOT NULL,
          "deleted_at" integer,
          "organization_id" text NOT NULL,
          "created_by" text,
          "deleted_by" text,
          "original_name" text NOT NULL,
          "original_size" integer DEFAULT 0 NOT NULL,
          "original_storage_key" text NOT NULL,
          "original_sha256_hash" text NOT NULL,
          "name" text NOT NULL,
          "mime_type" text NOT NULL,
          "content" text DEFAULT '' NOT NULL,
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null,
          FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null
        );
      `),

      db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_is_deleted_created_at_index" ON "documents" ("organization_id","is_deleted","created_at");`),
      db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_is_deleted_index" ON "documents" ("organization_id","is_deleted");`),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "documents_organization_id_original_sha256_hash_unique" ON "documents" ("organization_id","original_sha256_hash");`),
      db.run(sql`CREATE INDEX IF NOT EXISTS "documents_original_sha256_hash_index" ON "documents" ("original_sha256_hash");`),
      db.run(sql`CREATE INDEX IF NOT EXISTS "documents_organization_id_size_index" ON "documents" ("organization_id","original_size");`),
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "organization_invitations" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "organization_id" text NOT NULL,
          "email" text NOT NULL,
          "role" text,
          "status" text NOT NULL,
          "expires_at" integer NOT NULL,
          "inviter_id" text NOT NULL,
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
          FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
        );
      `),

      db.run(sql`CREATE TABLE IF NOT EXISTS "organization_members" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "organization_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" text NOT NULL,
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
);`),

      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_user_organization_unique" ON "organization_members" ("organization_id","user_id");`),
      db.run(sql`CREATE TABLE IF NOT EXISTS "organizations" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "name" text NOT NULL,
  "customer_id" text
);`),

      db.run(sql`CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "user_id" text NOT NULL,
  "role" text NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
);`),

      db.run(sql`CREATE INDEX IF NOT EXISTS "user_roles_role_index" ON "user_roles" ("role");`),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_unique_index" ON "user_roles" ("user_id","role");`),
      db.run(sql`CREATE TABLE IF NOT EXISTS "documents_tags" (
  "document_id" text NOT NULL,
  "tag_id" text NOT NULL,
  PRIMARY KEY("document_id", "tag_id"),
  FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade,
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE cascade
);`),

      db.run(sql`CREATE TABLE IF NOT EXISTS "tags" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "color" text NOT NULL,
  "description" text,
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
);`),

      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tags_organization_id_name_unique" ON "tags" ("organization_id","name");`),
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "email" text NOT NULL,
          "email_verified" integer DEFAULT false NOT NULL,
          "name" text,
          "image" text,
          "max_organization_count" integer
        );
      `),

      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");`),
      db.run(sql`CREATE INDEX IF NOT EXISTS "users_email_index" ON "users" ("email");`),
      db.run(sql`CREATE TABLE IF NOT EXISTS "auth_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "user_id" text,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "access_token_expires_at" integer,
  "refresh_token_expires_at" integer,
  "scope" text,
  "id_token" text,
  "password" text,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade
);`),

      db.run(sql`CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "token" text NOT NULL,
  "user_id" text,
  "expires_at" integer NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "active_organization_id" text,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade,
  FOREIGN KEY ("active_organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE set null
);`),

      db.run(sql`CREATE INDEX IF NOT EXISTS "auth_sessions_token_index" ON "auth_sessions" ("token");`),
      db.run(sql`CREATE TABLE IF NOT EXISTS "auth_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" integer NOT NULL
);`),

      db.run(sql`CREATE INDEX IF NOT EXISTS "auth_verifications_identifier_index" ON "auth_verifications" ("identifier");`),
      db.run(sql`CREATE TABLE IF NOT EXISTS "intake_emails" (
  "id" text PRIMARY KEY NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  "email_address" text NOT NULL,
  "organization_id" text NOT NULL,
  "allowed_origins" text DEFAULT '[]' NOT NULL,
  "is_enabled" integer DEFAULT true NOT NULL,
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
);`),

      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "intake_emails_email_address_unique" ON "intake_emails" ("email_address");`),
      db.run(sql`CREATE TABLE IF NOT EXISTS "organization_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "customer_id" text NOT NULL,
  "organization_id" text NOT NULL,
  "plan_id" text NOT NULL,
  "status" text NOT NULL,
  "seats_count" integer NOT NULL,
  "current_period_end" integer NOT NULL,
  "current_period_start" integer NOT NULL,
  "cancel_at_period_end" integer DEFAULT false NOT NULL,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade
);`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      // Tables
      db.run(sql`DROP TABLE IF EXISTS "organization_subscriptions";`),
      db.run(sql`DROP TABLE IF EXISTS "intake_emails";`),
      db.run(sql`DROP TABLE IF EXISTS "auth_verifications";`),
      db.run(sql`DROP TABLE IF EXISTS "auth_sessions";`),
      db.run(sql`DROP TABLE IF EXISTS "auth_accounts";`),
      db.run(sql`DROP TABLE IF EXISTS "tags";`),
      db.run(sql`DROP TABLE IF EXISTS "documents_tags";`),
      db.run(sql`DROP TABLE IF EXISTS "user_roles";`),
      db.run(sql`DROP TABLE IF EXISTS "organizations";`),
      db.run(sql`DROP TABLE IF EXISTS "organization_members";`),
      db.run(sql`DROP TABLE IF EXISTS "organization_invitations";`),
      db.run(sql`DROP TABLE IF EXISTS "documents";`),
      db.run(sql`DROP TABLE IF EXISTS "users";`),

      // // Indexes
      db.run(sql`DROP INDEX IF EXISTS "documents_organization_id_is_deleted_created_at_index";`),
      db.run(sql`DROP INDEX IF EXISTS "documents_organization_id_is_deleted_index";`),
      db.run(sql`DROP INDEX IF EXISTS "documents_organization_id_original_sha256_hash_unique";`),
      db.run(sql`DROP INDEX IF EXISTS "documents_original_sha256_hash_index";`),
      db.run(sql`DROP INDEX IF EXISTS "documents_organization_id_size_index";`),
      db.run(sql`DROP INDEX IF EXISTS "user_roles_role_index";`),
      db.run(sql`DROP INDEX IF EXISTS "user_roles_user_id_role_unique_index";`),
      db.run(sql`DROP INDEX IF EXISTS "tags_organization_id_name_unique";`),
      db.run(sql`DROP INDEX IF EXISTS "users_email_unique";`),
    ]);
  },
} satisfies Migration;
