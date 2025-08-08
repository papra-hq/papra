import type { Migration } from './migrations.types';
import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../modules/app/database/database';
import { serializeSchema } from '../modules/app/database/database.test-utils';
import { migrations } from './migrations.registry';
import { rollbackLastAppliedMigration, runMigrations } from './migrations.usecases';

describe('migrations registry', () => {
  describe('migrations', () => {
    test('each migration should have a unique name', () => {
      const migrationNames = migrations.map(m => m.name);
      const duplicateMigrationNames = migrationNames.filter(name => migrationNames.filter(n => n === name).length > 1);

      expect(duplicateMigrationNames).to.eql([], 'Each migration should have a unique name');
    });

    test('each migration should have a non empty name', () => {
      const migrationNames = migrations.map(m => m.name);
      const emptyMigrationNames = migrationNames.filter(name => name === '');

      expect(emptyMigrationNames).to.eql([], 'Each migration should have a non empty name');
    });

    test('all migrations must be able to be applied without error and the database should be in a consistent state', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      // This will throw if any migration is not able to be applied
      await runMigrations({ db, migrations });

      // check foreign keys are enabled
      const { rows } = await db.run(sql`pragma foreign_keys;`);
      expect(rows).to.eql([{ foreign_keys: 1 }]);
    });

    test('we can stop to any migration and still have a consistent database state', async () => {
      // Given like 3 migrations [A,B,C], creates [[A], [A,B], [A,B,C]]
      const migrationCombinations = migrations.map((m, i) => migrations.slice(0, i + 1));

      for (const migrationCombination of migrationCombinations) {
        const { db } = setupDatabase({ url: ':memory:' });
        await runMigrations({ db, migrations: migrationCombination });
      }
    });

    test('when we rollback to a previous migration, the database should be in the state of the previous migration', async () => {
      // Given like 3 migrations [A,B,C], creates [[A], [A,B], [A,B,C]]
      const migrationCombinations = migrations.map((m, i) => migrations.slice(0, i + 1));

      for (const [index, migrationCombination] of migrationCombinations.entries()) {
        const { db } = setupDatabase({ url: ':memory:' });
        const previousMigration = migrationCombinations[index - 1] ?? [] as Migration[];

        await runMigrations({ db, migrations: previousMigration });
        const previousDbState = await serializeSchema({ db });
        await runMigrations({ db, migrations: migrationCombination });
        await rollbackLastAppliedMigration({ db });

        const currentDbState = await serializeSchema({ db });

        expect(currentDbState).to.eql(previousDbState, `Downgrading from ${migrationCombination.at(-1)?.name ?? 'no migration'} should result in the same state as the previous migration`);
      }
    });

    test('regression test of the database state after running migrations, update the snapshot when the database state changes', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations });

      expect(await serializeSchema({ db })).toMatchInlineSnapshot(`
        "CREATE UNIQUE INDEX "api_keys_key_hash_unique" ON "api_keys" ("key_hash");
        CREATE INDEX "auth_sessions_token_index" ON "auth_sessions" ("token");
        CREATE INDEX "auth_verifications_identifier_index" ON "auth_verifications" ("identifier");
        CREATE INDEX "documents_organization_id_is_deleted_created_at_index" ON "documents" ("organization_id","is_deleted","created_at");
        CREATE INDEX "documents_organization_id_is_deleted_index" ON "documents" ("organization_id","is_deleted");
        CREATE UNIQUE INDEX "documents_organization_id_original_sha256_hash_unique" ON "documents" ("organization_id","original_sha256_hash");
        CREATE INDEX "documents_organization_id_size_index" ON "documents" ("organization_id","original_size");
        CREATE INDEX "documents_original_sha256_hash_index" ON "documents" ("original_sha256_hash");
        CREATE UNIQUE INDEX "intake_emails_email_address_unique" ON "intake_emails" ("email_address");
        CREATE INDEX "key_hash_index" ON "api_keys" ("key_hash");
        CREATE INDEX migrations_name_index ON migrations (name);
        CREATE INDEX migrations_run_at_index ON migrations (run_at);
        CREATE UNIQUE INDEX "organization_invitations_organization_email_unique" ON "organization_invitations" ("organization_id","email");
        CREATE UNIQUE INDEX "organization_members_user_organization_unique" ON "organization_members" ("organization_id","user_id");
        CREATE UNIQUE INDEX "tags_organization_id_name_unique" ON "tags" ("organization_id","name");
        CREATE INDEX "user_roles_role_index" ON "user_roles" ("role");
        CREATE UNIQUE INDEX "user_roles_user_id_role_unique_index" ON "user_roles" ("user_id","role");
        CREATE INDEX "users_email_index" ON "users" ("email");
        CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");
        CREATE UNIQUE INDEX "webhook_events_webhook_id_event_name_unique" ON "webhook_events" ("webhook_id","event_name");
        CREATE TABLE "api_key_organizations" ( "api_key_id" text NOT NULL, "organization_member_id" text NOT NULL, FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("organization_member_id") REFERENCES "organization_members"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "api_keys" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "name" text NOT NULL, "key_hash" text NOT NULL, "prefix" text NOT NULL, "user_id" text NOT NULL, "last_used_at" integer, "expires_at" integer, "permissions" text DEFAULT '[]' NOT NULL, "all_organizations" integer DEFAULT false NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "auth_accounts" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "user_id" text, "account_id" text NOT NULL, "provider_id" text NOT NULL, "access_token" text, "refresh_token" text, "access_token_expires_at" integer, "refresh_token_expires_at" integer, "scope" text, "id_token" text, "password" text, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "auth_sessions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "token" text NOT NULL, "user_id" text, "expires_at" integer NOT NULL, "ip_address" text, "user_agent" text, "active_organization_id" text, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("active_organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE set null );
        CREATE TABLE "auth_verifications" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" integer NOT NULL );
        CREATE TABLE "document_activity_log" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "document_id" text NOT NULL, "event" text NOT NULL, "event_data" text, "user_id" text, "tag_id" text, FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE set null );
        CREATE TABLE "documents" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "is_deleted" integer DEFAULT false NOT NULL, "deleted_at" integer, "organization_id" text NOT NULL, "created_by" text, "deleted_by" text, "original_name" text NOT NULL, "original_size" integer DEFAULT 0 NOT NULL, "original_storage_key" text NOT NULL, "original_sha256_hash" text NOT NULL, "name" text NOT NULL, "mime_type" text NOT NULL, "content" text DEFAULT '' NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null );
        CREATE VIRTUAL TABLE documents_fts USING fts5(id UNINDEXED, name, original_name, content, prefix='2 3 4');
        CREATE TABLE 'documents_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
        CREATE TABLE 'documents_fts_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3);
        CREATE TABLE 'documents_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
        CREATE TABLE 'documents_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
        CREATE TABLE 'documents_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
        CREATE TABLE "documents_tags" ( "document_id" text NOT NULL, "tag_id" text NOT NULL, PRIMARY KEY("document_id", "tag_id"), FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "intake_emails" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "email_address" text NOT NULL, "organization_id" text NOT NULL, "allowed_origins" text DEFAULT '[]' NOT NULL, "is_enabled" integer DEFAULT true NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, run_at INTEGER NOT NULL);
        CREATE TABLE "organization_invitations" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "email" text NOT NULL, "role" text NOT NULL, "status" text NOT NULL DEFAULT 'pending', "expires_at" integer NOT NULL, "inviter_id" text NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "organization_members" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "user_id" text NOT NULL, "role" text NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "organization_subscriptions" ( "id" text PRIMARY KEY NOT NULL, "customer_id" text NOT NULL, "organization_id" text NOT NULL, "plan_id" text NOT NULL, "status" text NOT NULL, "seats_count" integer NOT NULL, "current_period_end" integer NOT NULL, "current_period_start" integer NOT NULL, "cancel_at_period_end" integer DEFAULT false NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "organizations" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "name" text NOT NULL, "customer_id" text );
        CREATE TABLE sqlite_sequence(name,seq);
        CREATE TABLE "tagging_rule_actions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "tagging_rule_id" text NOT NULL, "tag_id" text NOT NULL, FOREIGN KEY ("tagging_rule_id") REFERENCES "tagging_rules"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "tagging_rule_conditions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "tagging_rule_id" text NOT NULL, "field" text NOT NULL, "operator" text NOT NULL, "value" text NOT NULL, "is_case_sensitive" integer DEFAULT false NOT NULL, FOREIGN KEY ("tagging_rule_id") REFERENCES "tagging_rules"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "tagging_rules" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "name" text NOT NULL, "description" text, "enabled" integer DEFAULT true NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "tags" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "name" text NOT NULL, "color" text NOT NULL, "description" text, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "user_roles" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "user_id" text NOT NULL, "role" text NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "users" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "email" text NOT NULL, "email_verified" integer DEFAULT false NOT NULL, "name" text, "image" text, "max_organization_count" integer );
        CREATE TABLE "webhook_deliveries" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "webhook_id" text NOT NULL, "event_name" text NOT NULL, "request_payload" text NOT NULL, "response_payload" text NOT NULL, "response_status" integer NOT NULL, FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "webhook_events" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "webhook_id" text NOT NULL, "event_name" text NOT NULL, FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "webhooks" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "name" text NOT NULL, "url" text NOT NULL, "secret" text, "enabled" integer DEFAULT true NOT NULL, "created_by" text, "organization_id" text, FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TRIGGER trigger_documents_fts_delete AFTER DELETE ON documents BEGIN DELETE FROM documents_fts WHERE id = old.id; END;
        CREATE TRIGGER trigger_documents_fts_insert AFTER INSERT ON documents BEGIN INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content); END;
        CREATE TRIGGER trigger_documents_fts_update AFTER UPDATE ON documents BEGIN UPDATE documents_fts SET name = new.name, original_name = new.original_name, content = new.content WHERE id = new.id; END;"
      `);
    });

    // Maybe a bit fragile, but it's to try to enforce to have migrations fail-safe
    test('if for some reasons we drop the migrations table, we can reapply all migrations', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations });

      const dbState = await serializeSchema({ db });

      await db.run(sql`DROP TABLE migrations`);
      await runMigrations({ db, migrations });

      expect(await serializeSchema({ db })).to.eq(dbState);
    });
  });
});
