import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';
import { getRuntimeTableColumns } from '../../modules/app/database/database.usecases';

export const aiExtractionOrganizationSettingsMigration = {
  name: 'ai-extraction-organization-settings',

  up: async ({ db }) => {
    const existingColumns = await getRuntimeTableColumns({
      tableName: 'organization_settings',
      db,
    });
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('ai_extraction_enabled')) {
      await db.run(sql`ALTER TABLE organization_settings ADD COLUMN ai_extraction_enabled integer`);
    }

    if (!hasColumn('ai_extraction_extract_date')) {
      await db.run(
        sql`ALTER TABLE organization_settings ADD COLUMN ai_extraction_extract_date integer`,
      );
    }

    if (!hasColumn('ai_extraction_extract_custom_properties')) {
      await db.run(
        sql`ALTER TABLE organization_settings ADD COLUMN ai_extraction_extract_custom_properties integer`,
      );
    }

    if (!hasColumn('ai_extraction_rename_documents')) {
      await db.run(
        sql`ALTER TABLE organization_settings ADD COLUMN ai_extraction_rename_documents integer`,
      );
    }

    if (!hasColumn('ai_extraction_filename_pattern')) {
      await db.run(
        sql`ALTER TABLE organization_settings ADD COLUMN ai_extraction_filename_pattern text`,
      );
    }
  },

  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_extraction_filename_pattern`);
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_extraction_rename_documents`);
    await db.run(
      sql`ALTER TABLE organization_settings DROP COLUMN ai_extraction_extract_custom_properties`,
    );
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_extraction_extract_date`);
    await db.run(sql`ALTER TABLE organization_settings DROP COLUMN ai_extraction_enabled`);
  },
} satisfies Migration;
