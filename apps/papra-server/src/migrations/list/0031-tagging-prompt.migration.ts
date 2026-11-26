import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';
import { getRuntimeTableColumns } from '../../modules/app/database/database.usecases';

export const taggingPromptMigration = {
  name: 'tagging-prompt',
  up: async ({ db }) => {
    const columns = await getRuntimeTableColumns({ tableName: 'organization_settings', db });
    if (!columns.includes('ai_tagging_prompt')) {
      await db.run(sql`ALTER TABLE organization_settings ADD COLUMN ai_tagging_prompt text`);
    }
  },
  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_tagging_prompt`);
  },
} satisfies Migration;
