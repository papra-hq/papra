import type { Kysely } from 'kysely';
import type { MigrationTable } from '../../../migrations/migrations.tables';
import type { ApiKeyOrganizationsTable, ApiKeysTable } from '../../api-keys/api-keys.new.tables';
import type { DocumentActivityLogTable } from '../../documents/document-activity/document-activity.tables';
import type { DocumentsTable } from '../../documents/documents.tables';
import type { IntakeEmailsTable } from '../../intake-emails/intake-emails.new.tables';
import type { OrganizationInvitationsTable, OrganizationMembersTable, OrganizationsTable } from '../../organizations/organizations.tables';
import type { UserRolesTable } from '../../roles/roles.tables';
import type { OrganizationSubscriptionsTable } from '../../subscriptions/subscriptions.new.tables';
import type { TaggingRuleActionsTable, TaggingRuleConditionsTable, TaggingRulesTable } from '../../tagging-rules/tagging-rules.new.tables';
import type { DocumentsTagsTable, TagsTable } from '../../tags/tags.tables';
import type { UsersTable } from '../../users/users.tables';
import type { WebhookDeliveriesTable, WebhookEventsTable, WebhooksTable } from '../../webhooks/webhooks.tables';
import type { AuthAccountsTable, AuthSessionsTable, AuthVerificationsTable } from '../auth/auth.new.tables';

export type Database = {
  migrations: MigrationTable;

  // Users & Auth
  users: UsersTable;
  user_roles: UserRolesTable;
  auth_sessions: AuthSessionsTable;
  auth_accounts: AuthAccountsTable;
  auth_verifications: AuthVerificationsTable;

  // Organizations
  organizations: OrganizationsTable;
  organization_members: OrganizationMembersTable;
  organization_invitations: OrganizationInvitationsTable;
  organization_subscriptions: OrganizationSubscriptionsTable;

  // Documents
  documents: DocumentsTable;
  document_activity_log: DocumentActivityLogTable;

  // Tags
  tags: TagsTable;
  documents_tags: DocumentsTagsTable;

  // Tagging Rules
  tagging_rules: TaggingRulesTable;
  tagging_rule_conditions: TaggingRuleConditionsTable;
  tagging_rule_actions: TaggingRuleActionsTable;

  // Webhooks
  webhooks: WebhooksTable;
  webhook_events: WebhookEventsTable;
  webhook_deliveries: WebhookDeliveriesTable;

  // API Keys
  api_keys: ApiKeysTable;
  api_key_organizations: ApiKeyOrganizationsTable;

  // Intake Emails
  intake_emails: IntakeEmailsTable;
};

export type DatabaseClient = Kysely<Database>;
