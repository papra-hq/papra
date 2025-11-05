import type { Database, DatabaseClient } from './database.types';
import { createNoopLogger } from '@crowlog/logger';
import { CompiledQuery } from 'kysely';
import { runMigrations } from '../../../migrations/migrations.usecases';
import { apiKeyOrganizationToDb, apiKeyToDb } from '../../api-keys/api-keys.models';
import { documentToDb } from '../../documents/documents.models';
import { intakeEmailToDb } from '../../intake-emails/intake-emails.models';
import { organizationInvitationToDb, organizationMemberToDb, organizationToDb } from '../../organizations/organizations.models';
import { organizationSubscriptionToDb } from '../../subscriptions/subscriptions.models';
import { taggingRuleActionToDb, taggingRuleConditionToDb, taggingRuleToDb } from '../../tagging-rules/tagging-rules.models';
import { documentTagToDb, tagToDb } from '../../tags/tags.models';
import { userToDb } from '../../users/users.models';
import { webhookDeliveryToDb, webhookEventToDb, webhookToDb } from '../../webhooks/webhooks.models';
import { setupDatabase } from './database';

export { createInMemoryDatabase, seedDatabase };

async function createInMemoryDatabase(seedingRows: SeedingRows | undefined = {}): Promise<{ db: DatabaseClient }> {
  const { db } = setupDatabase({ url: ':memory:' });

  await runMigrations({
    db,
    // In memory logger to avoid polluting the console with migrations logs
    logger: createNoopLogger(),
  });

  await seedDatabase({ db, seedingRows });

  return {
    db,
  };
}

// Take the insertable rows for each table
const tableSeedingMappers = {
  users: { table: 'users', mapper: userToDb },
  apiKeys: { table: 'api_keys', mapper: apiKeyToDb },
  apiKeyOrganizations: { table: 'api_key_organizations', mapper: apiKeyOrganizationToDb },
  organizations: { table: 'organizations', mapper: organizationToDb },
  organizationMembers: { table: 'organization_members', mapper: organizationMemberToDb },
  organizationInvitations: { table: 'organization_invitations', mapper: organizationInvitationToDb },
  organizationSubscriptions: { table: 'organization_subscriptions', mapper: organizationSubscriptionToDb },
  documents: { table: 'documents', mapper: documentToDb },
  tags: { table: 'tags', mapper: tagToDb },
  documentsTags: { table: 'documents_tags', mapper: documentTagToDb },
  taggingRules: { table: 'tagging_rules', mapper: taggingRuleToDb },
  taggingRuleActions: { table: 'tagging_rule_actions', mapper: taggingRuleActionToDb },
  taggingRuleConditions: { table: 'tagging_rule_conditions', mapper: taggingRuleConditionToDb },
  intakeEmails: { table: 'intake_emails', mapper: intakeEmailToDb },
  webhooks: { table: 'webhooks', mapper: webhookToDb },
  webhookEvents: { table: 'webhook_events', mapper: webhookEventToDb },
  webhookDeliveries: { table: 'webhook_deliveries', mapper: webhookDeliveryToDb },
};

type SeedingRows = {
  [Table in keyof typeof tableSeedingMappers]?: Parameters<typeof tableSeedingMappers[Table]['mapper']>['0'][];
};

async function seedDatabase({ db, seedingRows }: { db: DatabaseClient; seedingRows?: SeedingRows }) {
  if (!seedingRows) {
    return;
  }

  // Insert tables in order to respect foreign key constraints
  const orderedKeys: (keyof typeof tableSeedingMappers)[] = [
    'users',
    'organizations',
    'organizationMembers',
    'organizationInvitations',
    'organizationSubscriptions',
    'apiKeys',
    'apiKeyOrganizations',
    'documents',
    'tags',
    'documentsTags',
    'taggingRules',
    'taggingRuleActions',
    'taggingRuleConditions',
    'intakeEmails',
    'webhooks',
    'webhookEvents',
    'webhookDeliveries',
  ];

  for (const mapperKey of orderedKeys) {
    const rawRows = seedingRows[mapperKey];
    if (!rawRows) {
      continue;
    }

    const { table, mapper } = tableSeedingMappers[mapperKey];
    // @ts-expect-error - We know that the mapper exists for the table
    const rows = rawRows.map(rawRow => mapper(rawRow));
    await db
      .insertInto(table as keyof Database)
      .values(rows)
      .execute();
  }
}

export async function serializeSchema({ db }: { db: DatabaseClient }) {
  const { rows } = await db.executeQuery<{ sql: unknown }>(CompiledQuery.raw(`SELECT sql FROM sqlite_schema WHERE sql IS NOT NULL AND type IN ('table','index','view','trigger') ORDER BY type, name`));

  return rows
    .map(({ sql }) => minifyQuery(String(sql)))
    .join('\n');
}

function minifyQuery(query: string) {
  return `${query.replace(/\s+/g, ' ').trim().replace(/;$/, '')};`;
}
