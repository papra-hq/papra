import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { tagsTable } from '../tags/tags.table';
import { TAGGING_RULE_ID_PREFIX } from './tagging-rules.constants';

export const taggingRulesTable = sqliteTable(
  'tagging_rules',
  {
    ...createPrimaryKeyField({ prefix: TAGGING_RULE_ID_PREFIX }),
    ...createTimestampColumns(),

    organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  },
);

export const taggingRuleConditionsTable = sqliteTable(
  'tagging_rule_conditions',
  {
    ...createPrimaryKeyField({ prefix: 'trc' }),
    ...createTimestampColumns(),

    taggingRuleId: text('tagging_rule_id').notNull().references(() => taggingRulesTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    field: text('field').notNull(),
    operator: text('operator').notNull(),
    value: text('value').notNull(),
    isCaseSensitive: integer('is_case_sensitive', { mode: 'boolean' }).notNull().default(false),
  },
);

export const taggingRuleActionsTable = sqliteTable(
  'tagging_rule_actions',
  {
    ...createPrimaryKeyField({ prefix: 'tra' }),
    ...createTimestampColumns(),

    taggingRuleId: text('tagging_rule_id').notNull().references(() => taggingRulesTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagId: text('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
);
