import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const addIndexesMigration = {
  name: 'add-indexes',

  up: async ({ db }) => {
    await db.batch([
      // Deleting a document scans these tables for cascade/set-null enforcement
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "document_activity_log_document_id_index" ON "document_activity_log" ("document_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "document_share_links_document_id_index" ON "document_share_links" ("document_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "document_custom_property_values_related_document_id_index" ON "document_custom_property_values" ("related_document_id")`,
      ),

      // Trash purge cron: documents where is_deleted = ? and deleted_at < ?
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "documents_is_deleted_deleted_at_index" ON "documents" ("is_deleted", "deleted_at")`,
      ),

      // Tags list with document counts joins documents_tags by tag_id (also covers
      // the FK check when deleting a tag)
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "documents_tags_tag_id_document_id_index" ON "documents_tags" ("tag_id", "document_id")`,
      ),

      // Deleting a tag set-nulls its references in the activity log
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "document_activity_log_tag_id_index" ON "document_activity_log" ("tag_id")`,
      ),

      // Deleting an organization scans these tables for cascade/set-null enforcement
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "intake_emails_organization_id_index" ON "intake_emails" ("organization_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "webhooks_organization_id_index" ON "webhooks" ("organization_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "tagging_rules_organization_id_index" ON "tagging_rules" ("organization_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organization_subscriptions_organization_id_index" ON "organization_subscriptions" ("organization_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "auth_sessions_active_organization_id_index" ON "auth_sessions" ("active_organization_id")`,
      ),

      // Cascade chains reached by the deletions above
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "api_key_organizations_organization_member_id_index" ON "api_key_organizations" ("organization_member_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "api_key_organizations_api_key_id_index" ON "api_key_organizations" ("api_key_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_id_index" ON "webhook_deliveries" ("webhook_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "tagging_rule_conditions_tagging_rule_id_index" ON "tagging_rule_conditions" ("tagging_rule_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "tagging_rule_actions_tagging_rule_id_index" ON "tagging_rule_actions" ("tagging_rule_id")`,
      ),

      // Auth tables looked up by user on login/session flows (and scanned on user deletion)
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "auth_accounts_user_id_index" ON "auth_accounts" ("user_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "auth_sessions_user_id_index" ON "auth_sessions" ("user_id")`,
      ),
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "auth_two_factor_user_id_index" ON "auth_two_factor" ("user_id")`,
      ),

      // Listing the organizations of a user joins organization_members by user_id
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organization_members_user_id_index" ON "organization_members" ("user_id")`,
      ),

      // Organization purge cron: deleted_at is not null and scheduled_purge_at <= ?
      // The partial index replaces (deleted_at, scheduled_purge_at), whose leading
      // IS NOT NULL range constraint prevented narrowing by scheduled_purge_at
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organizations_scheduled_purge_at_index" ON "organizations" ("scheduled_purge_at") WHERE "deleted_at" IS NOT NULL`,
      ),
      db.run(sql`DROP INDEX IF EXISTS "organizations_deleted_at_purge_at_index"`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(
        sql`CREATE INDEX IF NOT EXISTS "organizations_deleted_at_purge_at_index" ON "organizations" ("deleted_at","scheduled_purge_at")`,
      ),
      db.run(sql`DROP INDEX IF EXISTS "organizations_scheduled_purge_at_index"`),
      db.run(sql`DROP INDEX IF EXISTS "organization_members_user_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "auth_two_factor_user_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "auth_sessions_user_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "auth_accounts_user_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "tagging_rule_actions_tagging_rule_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "tagging_rule_conditions_tagging_rule_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "webhook_deliveries_webhook_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "api_key_organizations_api_key_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "api_key_organizations_organization_member_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "auth_sessions_active_organization_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "organization_subscriptions_organization_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "tagging_rules_organization_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "webhooks_organization_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "intake_emails_organization_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "document_activity_log_tag_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "documents_tags_tag_id_document_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "documents_is_deleted_deleted_at_index"`),
      db.run(sql`DROP INDEX IF EXISTS "document_custom_property_values_related_document_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "document_share_links_document_id_index"`),
      db.run(sql`DROP INDEX IF EXISTS "document_activity_log_document_id_index"`),
    ]);
  },
} satisfies Migration;
