import type { Migration } from './migrations.types';

import { initialSchemaSetupMigration } from './list/0001-initial-schema-setup.migration';
import { documentsFtsMigration } from './list/0002-documents-fts.migration';
import { taggingRulesMigration } from './list/0003-tagging-rules.migration';
import { apiKeysMigration } from './list/0004-api-keys.migration';
import { organizationsWebhooksMigration } from './list/0005-organizations-webhooks.migration';
import { organizationsInvitationsImprovementMigration } from './list/0006-organizations-invitations-improvement.migration';
import { documentActivityLogMigration } from './list/0007-document-activity-log.migration';
import { documentActivityLogOnDeleteSetNullMigration } from './list/0008-document-activity-log-on-delete-set-null.migration';
import { dropLegacyMigrationsMigration } from './list/0009-drop-legacy-migrations.migration';
import { documentFileEncryptionMigration } from './list/0010-document-file-encryption.migration';
import { softDeleteOrganizationsMigration } from './list/0011-soft-delete-organizations.migration';
import { taggingRuleConditionMatchModeMigration } from './list/0012-tagging-rule-condition-match-mode.migration';
import { dropFts5TriggersMigration } from './list/0013-drop-fts-5-triggers.migration';
import { twoFactorAuthenticationMigration } from './list/0014-two-factor-authentication.migration';
import { indexDocumentsFtsIdsMigration } from './list/0015-index-documents-fts-ids.migration';
import { caseInsensitiveTagNameUniqConstraintMigration } from './list/0016-case-insensitive-tag-name-uniq-constraint.migration';

export const migrations: Migration[] = [
  initialSchemaSetupMigration,
  documentsFtsMigration,
  taggingRulesMigration,
  apiKeysMigration,
  organizationsWebhooksMigration,
  organizationsInvitationsImprovementMigration,
  documentActivityLogMigration,
  documentActivityLogOnDeleteSetNullMigration,
  dropLegacyMigrationsMigration,
  documentFileEncryptionMigration,
  softDeleteOrganizationsMigration,
  taggingRuleConditionMatchModeMigration,
  dropFts5TriggersMigration,
  twoFactorAuthenticationMigration,
  indexDocumentsFtsIdsMigration,
  caseInsensitiveTagNameUniqConstraintMigration,
];
