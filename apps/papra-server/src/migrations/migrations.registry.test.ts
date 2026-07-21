import type { Migration } from './migrations.types';
import { createNoopLogger } from '@crowlog/logger';
import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../modules/app/database/database';
import { serializeSchema } from '../modules/app/database/database.test-utils';
import { migrations } from './migrations.registry';
import { rollbackLastAppliedMigration, runMigrations } from './migrations.usecases';

describe('migrations registry', () => {
  describe('migrations', () => {
    test('each migration should have a unique name', () => {
      const migrationNames = migrations.map((m) => m.name);
      const duplicateMigrationNames = migrationNames.filter(
        (name) => migrationNames.filter((n) => n === name).length > 1,
      );

      expect(duplicateMigrationNames).to.eql([], 'Each migration should have a unique name');
    });

    test('each migration should have a non empty name', () => {
      const migrationNames = migrations.map((m) => m.name);
      const emptyMigrationNames = migrationNames.filter((name) => name === '');

      expect(emptyMigrationNames).to.eql([], 'Each migration should have a non empty name');
    });

    test('all migrations must be able to be applied without error and the database should be in a consistent state', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      // This will throw if any migration is not able to be applied
      await runMigrations({ db, migrations, logger: createNoopLogger() });

      // check foreign keys are enabled
      const { rows } = await db.run(sql`pragma foreign_keys;`);
      expect(rows).to.eql([{ foreign_keys: 1 }]);
    });

    test('we can stop to any migration and still have a consistent database state', async () => {
      // Given like 3 migrations [A,B,C], creates [[A], [A,B], [A,B,C]]
      const migrationCombinations = migrations.map((m, i) => migrations.slice(0, i + 1));

      for (const migrationCombination of migrationCombinations) {
        const { db } = setupDatabase({ url: ':memory:' });
        await runMigrations({ db, migrations: migrationCombination, logger: createNoopLogger() });
      }
    });

    test('when we rollback to a previous migration, the database should be in the state of the previous migration', async () => {
      // Given like 3 migrations [A,B,C], creates [[A], [A,B], [A,B,C]]
      const migrationCombinations = migrations.map((m, i) => migrations.slice(0, i + 1));

      for (const [index, migrationCombination] of migrationCombinations.entries()) {
        const { db } = setupDatabase({ url: ':memory:' });
        const previousMigration = migrationCombinations[index - 1] ?? ([] as Migration[]);

        await runMigrations({ db, migrations: previousMigration, logger: createNoopLogger() });
        const previousDbState = await serializeSchema({ db });
        await runMigrations({ db, migrations: migrationCombination, logger: createNoopLogger() });
        await rollbackLastAppliedMigration({ db });

        const currentDbState = await serializeSchema({ db });

        expect(currentDbState).to.eql(
          previousDbState,
          `Downgrading from ${migrationCombination.at(-1)?.name ?? 'no migration'} should result in the same state as the previous migration`,
        );
      }
    });

    test('regression test of the database state after running migrations, update the snapshot when the database state changes', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      expect(await serializeSchema({ db })).toMatchInlineSnapshot(`
        "CREATE INDEX "api_key_organizations_api_key_id_index" ON "api_key_organizations" ("api_key_id");
        CREATE INDEX "api_key_organizations_organization_member_id_index" ON "api_key_organizations" ("organization_member_id");
        CREATE UNIQUE INDEX "api_keys_key_hash_unique" ON "api_keys" ("key_hash");
        CREATE INDEX "auth_accounts_user_id_index" ON "auth_accounts" ("user_id");
        CREATE INDEX "auth_sessions_active_organization_id_index" ON "auth_sessions" ("active_organization_id");
        CREATE INDEX "auth_sessions_token_index" ON "auth_sessions" ("token");
        CREATE INDEX "auth_sessions_user_id_index" ON "auth_sessions" ("user_id");
        CREATE INDEX "auth_two_factor_user_id_index" ON "auth_two_factor" ("user_id");
        CREATE INDEX "auth_verifications_identifier_index" ON "auth_verifications" ("identifier");
        CREATE INDEX "backup_destinations_next_scheduled_at_index" ON "backup_destinations" ("next_scheduled_at");
        CREATE INDEX "backup_destinations_organization_id_index" ON "backup_destinations" ("organization_id");
        CREATE INDEX "backup_runs_destination_id_created_at_index" ON "backup_runs" ("destination_id", "created_at");
        CREATE INDEX "backup_runs_status_index" ON "backup_runs" ("status");
        CREATE UNIQUE INDEX "custom_property_definitions_organization_id_key_unique" ON "custom_property_definitions" ("organization_id", "key");
        CREATE UNIQUE INDEX "custom_property_definitions_organization_id_name_unique" ON "custom_property_definitions" ("organization_id", "name");
        CREATE UNIQUE INDEX "custom_property_select_options_definition_id_key_unique" ON "custom_property_select_options" ("property_definition_id", "key");
        CREATE UNIQUE INDEX "custom_property_select_options_definition_id_name_unique" ON "custom_property_select_options" ("property_definition_id", "name");
        CREATE INDEX "document_activity_log_document_id_index" ON "document_activity_log" ("document_id");
        CREATE INDEX "document_activity_log_tag_id_index" ON "document_activity_log" ("tag_id");
        CREATE INDEX "document_custom_property_values_definition_boolean_index" ON "document_custom_property_values" ("property_definition_id", "boolean_value");
        CREATE INDEX "document_custom_property_values_definition_date_index" ON "document_custom_property_values" ("property_definition_id", "date_value");
        CREATE INDEX "document_custom_property_values_definition_number_index" ON "document_custom_property_values" ("property_definition_id", "number_value");
        CREATE INDEX "document_custom_property_values_definition_related_document_id_index" ON "document_custom_property_values" ("property_definition_id", "related_document_id");
        CREATE INDEX "document_custom_property_values_definition_text_index" ON "document_custom_property_values" ("property_definition_id", "text_value");
        CREATE INDEX "document_custom_property_values_definition_user_id_index" ON "document_custom_property_values" ("property_definition_id", "user_id");
        CREATE INDEX "document_custom_property_values_document_id_index" ON "document_custom_property_values" ("document_id", "property_definition_id");
        CREATE INDEX "document_custom_property_values_related_document_id_index" ON "document_custom_property_values" ("related_document_id");
        CREATE INDEX "document_share_links_document_id_index" ON "document_share_links" ("document_id");
        CREATE INDEX "document_share_links_organization_id_document_id_index" ON "document_share_links" ("organization_id", "document_id");
        CREATE UNIQUE INDEX "document_share_links_token_unique" ON "document_share_links" ("token");
        CREATE INDEX documents_file_encryption_kek_version_index ON documents (file_encryption_kek_version);
        CREATE INDEX "documents_folder_id_idx" ON "documents" ("folder_id");
        CREATE INDEX "documents_is_deleted_deleted_at_index" ON "documents" ("is_deleted", "deleted_at");
        CREATE INDEX documents_organization_id_document_date_index ON documents(organization_id, document_date);
        CREATE INDEX "documents_organization_id_is_deleted_created_at_index" ON "documents" ("organization_id","is_deleted","created_at");
        CREATE INDEX "documents_organization_id_is_deleted_index" ON "documents" ("organization_id","is_deleted");
        CREATE UNIQUE INDEX "documents_organization_id_original_sha256_hash_unique" ON "documents" ("organization_id","original_sha256_hash");
        CREATE INDEX "documents_organization_id_size_index" ON "documents" ("organization_id","original_size");
        CREATE INDEX "documents_original_sha256_hash_index" ON "documents" ("original_sha256_hash");
        CREATE INDEX "documents_tags_tag_id_document_id_index" ON "documents_tags" ("tag_id", "document_id");
        CREATE INDEX "folders_organization_id_idx" ON "folders" ("organization_id");
        CREATE INDEX "folders_parent_id_idx" ON "folders" ("parent_id");
        CREATE UNIQUE INDEX "intake_emails_email_address_unique" ON "intake_emails" ("email_address");
        CREATE INDEX "intake_emails_organization_id_index" ON "intake_emails" ("organization_id");
        CREATE INDEX "key_hash_index" ON "api_keys" ("key_hash");
        CREATE INDEX migrations_name_index ON migrations (name);
        CREATE INDEX migrations_run_at_index ON migrations (run_at);
        CREATE UNIQUE INDEX "organization_invitations_organization_email_unique" ON "organization_invitations" ("organization_id","email");
        CREATE INDEX "organization_members_user_id_index" ON "organization_members" ("user_id");
        CREATE UNIQUE INDEX "organization_members_user_organization_unique" ON "organization_members" ("organization_id","user_id");
        CREATE INDEX "organization_subscriptions_organization_id_index" ON "organization_subscriptions" ("organization_id");
        CREATE INDEX "organizations_deleted_by_deleted_at_index" ON "organizations" ("deleted_by","deleted_at");
        CREATE INDEX "organizations_scheduled_purge_at_index" ON "organizations" ("scheduled_purge_at") WHERE "deleted_at" IS NOT NULL;
        CREATE INDEX "tagging_rule_actions_tagging_rule_id_index" ON "tagging_rule_actions" ("tagging_rule_id");
        CREATE INDEX "tagging_rule_conditions_tagging_rule_id_index" ON "tagging_rule_conditions" ("tagging_rule_id");
        CREATE INDEX "tagging_rules_organization_id_index" ON "tagging_rules" ("organization_id");
        CREATE UNIQUE INDEX tags_organization_id_normalized_name_unique ON tags (organization_id, normalized_name);
        CREATE UNIQUE INDEX "user_plan_entitlements_user_id_type_unique" ON "user_plan_entitlements" ("user_id", "type");
        CREATE INDEX "user_roles_role_index" ON "user_roles" ("role");
        CREATE UNIQUE INDEX "user_roles_user_id_role_unique_index" ON "user_roles" ("user_id","role");
        CREATE INDEX "users_email_index" ON "users" ("email");
        CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");
        CREATE INDEX "webhook_deliveries_webhook_id_index" ON "webhook_deliveries" ("webhook_id");
        CREATE UNIQUE INDEX "webhook_events_webhook_id_event_name_unique" ON "webhook_events" ("webhook_id","event_name");
        CREATE INDEX "webhooks_organization_id_index" ON "webhooks" ("organization_id");
        CREATE TABLE "api_key_organizations" ( "api_key_id" text NOT NULL, "organization_member_id" text NOT NULL, FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("organization_member_id") REFERENCES "organization_members"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "api_keys" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "name" text NOT NULL, "key_hash" text NOT NULL, "prefix" text NOT NULL, "user_id" text NOT NULL, "last_used_at" integer, "expires_at" integer, "permissions" text DEFAULT '[]' NOT NULL, "all_organizations" integer DEFAULT false NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "auth_accounts" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "user_id" text, "account_id" text NOT NULL, "provider_id" text NOT NULL, "access_token" text, "refresh_token" text, "access_token_expires_at" integer, "refresh_token_expires_at" integer, "scope" text, "id_token" text, "password" text, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "auth_sessions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "token" text NOT NULL, "user_id" text, "expires_at" integer NOT NULL, "ip_address" text, "user_agent" text, "active_organization_id" text, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("active_organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE set null );
        CREATE TABLE "auth_two_factor" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "user_id" text, "secret" text, "backup_codes" text, "verified" integer DEFAULT true NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "auth_verifications" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" integer NOT NULL );
        CREATE TABLE "backup_destinations" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "driver" text NOT NULL, "display_name" text NOT NULL, "settings_json" text NOT NULL DEFAULT '{}', "encrypted_credentials" text NOT NULL, "account_label" text, "wrapped_backup_key" text NOT NULL, "backup_key_algorithm" text NOT NULL, "remote_folder_ref" text, "is_schedule_enabled" integer NOT NULL DEFAULT false, "schedule_days_json" text NOT NULL DEFAULT '[]', "schedule_hour" integer, "schedule_minute" integer, "last_run_at" integer, "next_scheduled_at" integer, "is_enabled" integer NOT NULL DEFAULT true, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "backup_runs" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "destination_id" text NOT NULL, "organization_id" text NOT NULL, "trigger" text NOT NULL, "status" text NOT NULL, "remote_file_id" text, "remote_file_name" text, "documents_count" integer, "total_size_bytes" integer, "error_message" text, "completed_at" integer, FOREIGN KEY ("destination_id") REFERENCES "backup_destinations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "custom_property_definitions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE, "name" text NOT NULL, "key" text NOT NULL, "description" text, "type" text NOT NULL, "config" text, "display_order" integer NOT NULL DEFAULT 0 );
        CREATE TABLE "custom_property_select_options" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "property_definition_id" text NOT NULL REFERENCES "custom_property_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE, "name" text NOT NULL, "key" text NOT NULL, "display_order" integer NOT NULL DEFAULT 0 );
        CREATE TABLE "document_activity_log" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "document_id" text NOT NULL, "event" text NOT NULL, "event_data" text, "user_id" text, "tag_id" text, FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE set null );
        CREATE TABLE "document_custom_property_values" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "document_id" text NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE, "property_definition_id" text NOT NULL REFERENCES "custom_property_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE, "text_value" text, "number_value" real, "date_value" integer, "boolean_value" integer, "select_option_id" text REFERENCES "custom_property_select_options"("id") ON DELETE CASCADE ON UPDATE CASCADE, "user_id" text REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, "related_document_id" text REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE );
        CREATE TABLE "document_share_links" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "document_id" text NOT NULL, "created_by" text, "token" text NOT NULL, "expires_at" integer, "password_hash" text, "is_enabled" integer DEFAULT true NOT NULL, "last_accessed_at" integer, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null );
        CREATE TABLE "document_views" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "name" text NOT NULL, "query" text NOT NULL, "description" text, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE("organization_id", "name") );
        CREATE TABLE "documents" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "is_deleted" integer DEFAULT false NOT NULL, "deleted_at" integer, "organization_id" text NOT NULL, "created_by" text, "deleted_by" text, "original_name" text NOT NULL, "original_size" integer DEFAULT 0 NOT NULL, "original_storage_key" text NOT NULL, "original_sha256_hash" text NOT NULL, "name" text NOT NULL, "mime_type" text NOT NULL, "content" text DEFAULT '' NOT NULL, file_encryption_key_wrapped TEXT, file_encryption_kek_version TEXT, file_encryption_algorithm TEXT, document_date INTEGER, notes TEXT, "folder_id" text REFERENCES "folders"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null );
        CREATE VIRTUAL TABLE documents_fts USING fts5( document_id, organization_id, name, content, prefix='2 3 4' );
        CREATE TABLE 'documents_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
        CREATE TABLE 'documents_fts_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3);
        CREATE TABLE 'documents_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
        CREATE TABLE 'documents_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
        CREATE TABLE 'documents_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
        CREATE TABLE "documents_tags" ( "document_id" text NOT NULL, "tag_id" text NOT NULL, PRIMARY KEY("document_id", "tag_id"), FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "folders" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "parent_id" text, "name" text NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "intake_emails" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "email_address" text NOT NULL, "organization_id" text NOT NULL, "allowed_origins" text DEFAULT '[]' NOT NULL, "is_enabled" integer DEFAULT true NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "kv_store" ( "key" text PRIMARY KEY NOT NULL, "value" text NOT NULL, "expires_at" integer );
        CREATE TABLE migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, run_at INTEGER NOT NULL);
        CREATE TABLE "organization_invitations" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "email" text NOT NULL, "role" text NOT NULL, "status" text NOT NULL DEFAULT 'pending', "expires_at" integer NOT NULL, "inviter_id" text NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "organization_members" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "user_id" text NOT NULL, "role" text NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "organization_settings" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "ai_auto_tagging_enabled" integer, "ai_auto_tagging_can_create_new_tags" integer, "ai_auto_tagging_max_tags" integer, "ai_auto_tagging_model_id" text, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE("organization_id") );
        CREATE TABLE "organization_subscriptions" ( "id" text PRIMARY KEY NOT NULL, "customer_id" text NOT NULL, "organization_id" text NOT NULL, "plan_id" text NOT NULL, "status" text NOT NULL, "seats_count" integer NOT NULL, "current_period_end" integer NOT NULL, "current_period_start" integer NOT NULL, "cancel_at_period_end" integer DEFAULT false NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "organizations" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "name" text NOT NULL, "customer_id" text , "deleted_by" text REFERENCES users(id), "deleted_at" integer, "scheduled_purge_at" integer);
        CREATE TABLE sqlite_sequence(name,seq);
        CREATE TABLE "tagging_rule_actions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "tagging_rule_id" text NOT NULL, "tag_id" text NOT NULL, FOREIGN KEY ("tagging_rule_id") REFERENCES "tagging_rules"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "tagging_rule_conditions" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "tagging_rule_id" text NOT NULL, "field" text NOT NULL, "operator" text NOT NULL, "value" text NOT NULL, "is_case_sensitive" integer DEFAULT false NOT NULL, FOREIGN KEY ("tagging_rule_id") REFERENCES "tagging_rules"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "tagging_rules" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "name" text NOT NULL, "description" text, "enabled" integer DEFAULT true NOT NULL, "condition_match_mode" text DEFAULT 'all' NOT NULL, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "tags" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "organization_id" text NOT NULL, "name" text NOT NULL, "color" text NOT NULL, "description" text, "normalized_name" text, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "user_plan_entitlements" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "granted_at" integer NOT NULL, "expires_at" integer, "last_verified_at" integer, "user_id" text NOT NULL, "type" text NOT NULL, "source" text NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "user_roles" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "user_id" text NOT NULL, "role" text NOT NULL, FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "users" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "email" text NOT NULL, "email_verified" integer DEFAULT false NOT NULL, "name" text, "image" text, "max_organization_count" integer , "two_factor_enabled" integer DEFAULT false NOT NULL);
        CREATE TABLE "webhook_deliveries" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "webhook_id" text NOT NULL, "event_name" text NOT NULL, "request_payload" text NOT NULL, "response_payload" text NOT NULL, "response_status" integer NOT NULL, FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "webhook_events" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "webhook_id" text NOT NULL, "event_name" text NOT NULL, FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON UPDATE cascade ON DELETE cascade );
        CREATE TABLE "webhooks" ( "id" text PRIMARY KEY NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL, "name" text NOT NULL, "url" text NOT NULL, "secret" text, "enabled" integer DEFAULT true NOT NULL, "created_by" text, "organization_id" text, FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON UPDATE cascade ON DELETE cascade );"
      `);
    });

    // Maybe a bit fragile, but it's to try to enforce to have migrations fail-safe
    test('if for some reasons we drop the migrations table, we can reapply all migrations', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      const dbState = await serializeSchema({ db });

      await db.run(sql`DROP TABLE migrations`);
      await runMigrations({ db, migrations, logger: createNoopLogger() });

      expect(await serializeSchema({ db })).to.eq(dbState);
    });
  });
});
