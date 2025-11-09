import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const taggingRuleConditionMatchModeMigration = {
  name: 'tagging-rule-condition-match-mode',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(tagging_rules)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('condition_match_mode')) {
      await db.run(sql`ALTER TABLE "tagging_rules" ADD "condition_match_mode" text DEFAULT 'all' NOT NULL;`);
    }
  },

  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE "tagging_rules" DROP COLUMN "condition_match_mode";`);
  },
} satisfies Migration;
