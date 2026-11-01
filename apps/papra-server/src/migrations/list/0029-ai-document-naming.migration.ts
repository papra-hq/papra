import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';
import { getRuntimeTableColumns } from '../../modules/app/database/database.usecases';

export const aiDocumentNamingMigration = {
  name: 'ai-document-naming',
  up: async ({ db }) => {
    const columns = await getRuntimeTableColumns({ tableName: 'organization_settings', db });
    if (!columns.includes('ai_auto_naming_enabled')) {
      await db.run(
        sql`ALTER TABLE organization_settings ADD COLUMN ai_auto_naming_enabled integer`,
      );
    }
    if (!columns.includes('ai_filename_prompt')) {
      await db.run(sql`ALTER TABLE organization_settings ADD COLUMN ai_filename_prompt text`);
    }
  },
  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_filename_prompt`);
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_auto_naming_enabled`);
  },
} satisfies Migration;
