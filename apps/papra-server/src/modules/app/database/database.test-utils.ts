import type { Database } from './database.types';
import { sql } from 'drizzle-orm';
import { runMigrations } from '../../../migrations/migrations.usecases';
import { apiKeyOrganizationsTable, apiKeysTable } from '../../api-keys/api-keys.tables';
import { documentsTable } from '../../documents/documents.table';
import { intakeEmailsTable } from '../../intake-emails/intake-emails.tables';
import { organizationInvitationsTable, organizationMembersTable, organizationsTable } from '../../organizations/organizations.table';
import { organizationSubscriptionsTable } from '../../subscriptions/subscriptions.tables';
import { taggingRuleActionsTable, taggingRuleConditionsTable, taggingRulesTable } from '../../tagging-rules/tagging-rules.tables';
import { documentsTagsTable, tagsTable } from '../../tags/tags.table';
import { usersTable } from '../../users/users.table';
import { webhookDeliveriesTable, webhookEventsTable, webhooksTable } from '../../webhooks/webhooks.tables';
import { setupDatabase } from './database';

export { createInMemoryDatabase, seedDatabase };

async function createInMemoryDatabase(seedOptions: Omit<Parameters<typeof seedDatabase>[0], 'db'> | undefined = {}) {
  const { db } = setupDatabase({ url: ':memory:' });

  await runMigrations({ db });

  await seedDatabase({ db, ...seedOptions });

  return {
    db,
  };
}

const seedTables = {
  users: usersTable,
  organizations: organizationsTable,
  organizationMembers: organizationMembersTable,
  documents: documentsTable,
  tags: tagsTable,
  documentsTags: documentsTagsTable,
  intakeEmails: intakeEmailsTable,
  organizationSubscriptions: organizationSubscriptionsTable,
  taggingRules: taggingRulesTable,
  taggingRuleConditions: taggingRuleConditionsTable,
  taggingRuleActions: taggingRuleActionsTable,
  apiKeys: apiKeysTable,
  apiKeyOrganizations: apiKeyOrganizationsTable,
  webhooks: webhooksTable,
  webhookEvents: webhookEventsTable,
  webhookDeliveries: webhookDeliveriesTable,
  organizationInvitations: organizationInvitationsTable,
} as const;

type SeedTablesRows = {
  [K in keyof typeof seedTables]?: typeof seedTables[K] extends { $inferInsert: infer T } ? T[] : never;
};

async function seedDatabase({ db, ...seedRows }: { db: Database } & SeedTablesRows) {
  await Promise.all(
    Object
      .entries(seedRows)
      .map(async ([table, rows]) => db
        .insert(seedTables[table as keyof typeof seedTables])
        .values(rows)
        .execute(),
      ),
  );
}

/*
PRAGMA encoding;
PRAGMA page_size;
PRAGMA auto_vacuum;
PRAGMA journal_mode;      -- WAL is persistent
PRAGMA user_version;
PRAGMA application_id;

*/

export async function serializeSchema({ db }: { db: Database }) {
  const result = await db.batch([
    // db.run(sql`PRAGMA encoding`),
    // db.run(sql`PRAGMA page_size`),
    // db.run(sql`PRAGMA auto_vacuum`),
    // db.run(sql`PRAGMA journal_mode`),
    // db.run(sql`PRAGMA user_version`),
    // db.run(sql`PRAGMA application_id`),
    db.run(sql`SELECT sql FROM sqlite_schema WHERE sql IS NOT NULL AND type IN ('table','index','view','trigger') ORDER BY type, name`),
  ]);

  return Array
    .from(result.values())
    .flatMap(({ rows }) => rows.map(({ sql }) => minifyQuery(String(sql))))
    .join('\n');
}

function minifyQuery(query: string) {
  return `${query.replace(/\s+/g, ' ').trim().replace(/;$/, '')};`;
}
