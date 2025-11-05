import type { Migration } from './migrations.types';
import { createNoopLogger } from '@crowlog/logger';
import { sql } from 'kysely';
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
      await runMigrations({ db, migrations, logger: createNoopLogger() });

      // check foreign keys are enabled
      const { rows } = await db.executeQuery<{ foreign_keys: number }>(sql`PRAGMA foreign_keys`.compile(db));
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
        const previousMigration = migrationCombinations[index - 1] ?? [] as Migration[];

        await runMigrations({ db, migrations: previousMigration, logger: createNoopLogger() });
        const previousDbState = await serializeSchema({ db });
        await runMigrations({ db, migrations: migrationCombination, logger: createNoopLogger() });
        await rollbackLastAppliedMigration({ db });

        const currentDbState = await serializeSchema({ db });

        expect(currentDbState).to.eql(previousDbState, `Downgrading from ${migrationCombination.at(-1)?.name ?? 'no migration'} should result in the same state as the previous migration`);
      }
    });

    test('regression test of the database state after running migrations, update the snapshot when the database state changes', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      expect(await serializeSchema({ db })).toMatchInlineSnapshot(`
        "CREATE UNIQUE INDEX "api_keys_key_hash_unique" on "api_keys" ("key_hash");
        CREATE INDEX "auth_sessions_token_index" on "auth_sessions" ("token");
        CREATE INDEX "auth_verifications_identifier_index" on "auth_verifications" ("identifier");
        CREATE INDEX "documents_file_encryption_kek_version_index" on "documents" ("file_encryption_kek_version");
        CREATE INDEX "documents_organization_id_is_deleted_created_at_index" on "documents" ("organization_id", "is_deleted", "created_at");
        CREATE INDEX "documents_organization_id_is_deleted_index" on "documents" ("organization_id", "is_deleted");
        CREATE UNIQUE INDEX "documents_organization_id_original_sha256_hash_unique" on "documents" ("organization_id", "original_sha256_hash");
        CREATE INDEX "documents_organization_id_size_index" on "documents" ("organization_id", "original_size");
        CREATE INDEX "documents_original_sha256_hash_index" on "documents" ("original_sha256_hash");
        CREATE UNIQUE INDEX "intake_emails_email_address_unique" on "intake_emails" ("email_address");
        CREATE INDEX "key_hash_index" on "api_keys" ("key_hash");
        CREATE INDEX "migrations_name_index" on "migrations" ("name");
        CREATE INDEX "migrations_run_at_index" on "migrations" ("run_at");
        CREATE UNIQUE INDEX "organization_invitations_organization_email_unique" on "organization_invitations" ("organization_id", "email");
        CREATE UNIQUE INDEX "organization_members_user_organization_unique" on "organization_members" ("organization_id", "user_id");
        CREATE INDEX "organizations_deleted_at_purge_at_index" on "organizations" ("deleted_at", "scheduled_purge_at");
        CREATE INDEX "organizations_deleted_by_deleted_at_index" on "organizations" ("deleted_by", "deleted_at");
        CREATE UNIQUE INDEX "tags_organization_id_name_unique" on "tags" ("organization_id", "name");
        CREATE INDEX "user_roles_role_index" on "user_roles" ("role");
        CREATE UNIQUE INDEX "user_roles_user_id_role_unique_index" on "user_roles" ("user_id", "role");
        CREATE INDEX "users_email_index" on "users" ("email");
        CREATE UNIQUE INDEX "users_email_unique" on "users" ("email");
        CREATE UNIQUE INDEX "webhook_events_webhook_id_event_name_unique" on "webhook_events" ("webhook_id", "event_name");
        CREATE TABLE "api_key_organizations" ("api_key_id" text not null references "api_keys" ("id") on delete cascade on update cascade, "organization_member_id" text not null references "organization_members" ("id") on delete cascade on update cascade);
        CREATE TABLE "api_keys" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "name" text not null, "key_hash" text not null, "prefix" text not null, "user_id" text not null references "users" ("id") on delete cascade on update cascade, "last_used_at" integer, "expires_at" integer, "permissions" text default '[]' not null, "all_organizations" integer default 0 not null);
        CREATE TABLE "auth_accounts" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "user_id" text references "users" ("id") on delete cascade on update cascade, "account_id" text not null, "provider_id" text not null, "access_token" text, "refresh_token" text, "access_token_expires_at" integer, "refresh_token_expires_at" integer, "scope" text, "id_token" text, "password" text);
        CREATE TABLE "auth_sessions" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "token" text not null, "user_id" text references "users" ("id") on delete cascade on update cascade, "expires_at" integer not null, "ip_address" text, "user_agent" text, "active_organization_id" text references "organizations" ("id") on delete set null on update cascade);
        CREATE TABLE "auth_verifications" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "identifier" text not null, "value" text not null, "expires_at" integer not null);
        CREATE TABLE "document_activity_log" ("id" text not null primary key, "created_at" integer not null, "document_id" text not null references "documents" ("id") on delete cascade on update cascade, "event" text not null, "event_data" text, "user_id" text references "users" ("id") on delete set null on update cascade, "tag_id" text references "tags" ("id") on delete set null on update cascade);
        CREATE TABLE "documents" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "is_deleted" integer default 0 not null, "deleted_at" integer, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "created_by" text references "users" ("id") on delete set null on update cascade, "deleted_by" text references "users" ("id") on delete set null on update cascade, "original_name" text not null, "original_size" integer default 0 not null, "original_storage_key" text not null, "original_sha256_hash" text not null, "name" text not null, "mime_type" text not null, "content" text default '' not null, "file_encryption_key_wrapped" text, "file_encryption_kek_version" text, "file_encryption_algorithm" text);
        CREATE VIRTUAL TABLE documents_fts USING fts5(id UNINDEXED, name, original_name, content, prefix='2 3 4');
        CREATE TABLE 'documents_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
        CREATE TABLE 'documents_fts_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3);
        CREATE TABLE 'documents_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
        CREATE TABLE 'documents_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
        CREATE TABLE 'documents_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
        CREATE TABLE "documents_tags" ("document_id" text not null references "documents" ("id") on delete cascade on update cascade, "tag_id" text not null references "tags" ("id") on delete cascade on update cascade, constraint "documents_tags_pkey" primary key ("document_id", "tag_id"));
        CREATE TABLE "intake_emails" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "email_address" text not null, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "allowed_origins" text default '[]' not null, "is_enabled" integer default 1 not null);
        CREATE TABLE "migrations" ("id" integer primary key autoincrement, "name" text not null, "run_at" integer not null);
        CREATE TABLE "organization_invitations" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "email" text not null, "role" text not null, "status" text not null DEFAULT 'pending', "expires_at" integer not null, "inviter_id" text not null references "users" ("id") on delete cascade on update cascade);
        CREATE TABLE "organization_members" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "user_id" text not null references "users" ("id") on delete cascade on update cascade, "role" text not null);
        CREATE TABLE "organization_subscriptions" ("id" text not null primary key, "customer_id" text not null, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "plan_id" text not null, "status" text not null, "seats_count" integer not null, "current_period_end" integer not null, "current_period_start" integer not null, "cancel_at_period_end" integer default 0 not null, "created_at" integer not null, "updated_at" integer not null);
        CREATE TABLE "organizations" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "name" text not null, "customer_id" text, "deleted_by" text references "users" ("id") on delete set null on update cascade, "deleted_at" integer, "scheduled_purge_at" integer);
        CREATE TABLE sqlite_sequence(name,seq);
        CREATE TABLE "tagging_rule_actions" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "tagging_rule_id" text not null references "tagging_rules" ("id") on delete cascade on update cascade, "tag_id" text not null references "tags" ("id") on delete cascade on update cascade);
        CREATE TABLE "tagging_rule_conditions" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "tagging_rule_id" text not null references "tagging_rules" ("id") on delete cascade on update cascade, "field" text not null, "operator" text not null, "value" text not null, "is_case_sensitive" integer default 0 not null);
        CREATE TABLE "tagging_rules" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "name" text not null, "description" text, "enabled" integer default 1 not null, "condition_match_mode" text default 'all' not null);
        CREATE TABLE "tags" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "organization_id" text not null references "organizations" ("id") on delete cascade on update cascade, "name" text not null, "color" text not null, "description" text);
        CREATE TABLE "user_roles" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "user_id" text not null references "users" ("id") on delete cascade on update cascade, "role" text not null);
        CREATE TABLE "users" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "email" text not null, "email_verified" integer default 0 not null, "name" text, "image" text, "max_organization_count" integer);
        CREATE TABLE "webhook_deliveries" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "webhook_id" text not null references "webhooks" ("id") on delete cascade on update cascade, "event_name" text not null, "request_payload" text not null, "response_payload" text not null, "response_status" integer not null);
        CREATE TABLE "webhook_events" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "webhook_id" text not null references "webhooks" ("id") on delete cascade on update cascade, "event_name" text not null);
        CREATE TABLE "webhooks" ("id" text not null primary key, "created_at" integer not null, "updated_at" integer not null, "name" text not null, "url" text not null, "secret" text, "enabled" integer default 1 not null, "created_by" text references "users" ("id") on delete set null on update cascade, "organization_id" text references "organizations" ("id") on delete cascade on update cascade);
        CREATE TRIGGER trigger_documents_fts_delete AFTER DELETE ON documents BEGIN DELETE FROM documents_fts WHERE id = old.id; END;
        CREATE TRIGGER trigger_documents_fts_insert AFTER INSERT ON documents BEGIN INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content); END;
        CREATE TRIGGER trigger_documents_fts_update AFTER UPDATE ON documents BEGIN UPDATE documents_fts SET name = new.name, original_name = new.original_name, content = new.content WHERE id = new.id; END;"
      `);
    });

    // Maybe a bit fragile, but it's to try to enforce to have migrations fail-safe
    test('if for some reasons we drop the migrations table, we can reapply all migrations', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await runMigrations({ db, migrations, logger: createNoopLogger() });

      const dbState = await serializeSchema({ db });

      await db.executeQuery(sql`DROP TABLE migrations`.compile(db));
      await runMigrations({ db, migrations, logger: createNoopLogger() });

      expect(await serializeSchema({ db })).to.eq(dbState);
    });
  });
});
