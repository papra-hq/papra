import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';
import { getRuntimeTableColumns } from '../../modules/app/database/database.usecases';

export const separateNamingRequestMigration = {
  name: 'separate-naming-request',
  up: async ({ db }) => {
    const columns = await getRuntimeTableColumns({ tableName: 'organization_settings', db });
    if (!columns.includes('ai_separate_naming_request')) {
      await db.run(
        sql`ALTER TABLE organization_settings ADD COLUMN ai_separate_naming_request integer`,
      );
    }
  },
  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_separate_naming_request`);
  },
} satisfies Migration;
