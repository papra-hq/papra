import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { organizationsTable } from '../organizations/organizations.table';
import type { AiCreditsUsageDetails, AiCreditsUsageSource } from './ai-credits.types';

export const organizationAiCreditsUsageTable = sqliteTable('organization_ai_credits_usage', {
  ...createPrimaryKeyField({ prefix: 'aicu' }),
  ...createTimestampColumns(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  creditsConsumed: integer('credits_consumed').notNull(),

  usage: text('usage', { mode: 'json' }).notNull().$type<AiCreditsUsageDetails>(),

  source: text('source').notNull().$type<AiCreditsUsageSource>(),
});
