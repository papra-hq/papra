import type { Migration } from '../migrations.types';
import { sql } from 'kysely';
import { CONDITION_MATCH_MODES } from '../../modules/tagging-rules/tagging-rules.constants';

export const taggingRuleConditionMatchModeMigration = {
  name: 'tagging-rule-condition-match-mode',

  up: async ({ db }) => {
    const tableInfo = await db.executeQuery<{ name: string }>(sql`PRAGMA table_info(tagging_rules)`.compile(db));
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('condition_match_mode')) {
      await db.schema
        .alterTable('tagging_rules')
        .addColumn('condition_match_mode', 'text', col => col.defaultTo(CONDITION_MATCH_MODES.ALL).notNull())
        .execute();
    }
  },

  down: async ({ db }) => {
    await db.schema.alterTable('tagging_rules').dropColumn('condition_match_mode').execute();
  },
} satisfies Migration;
