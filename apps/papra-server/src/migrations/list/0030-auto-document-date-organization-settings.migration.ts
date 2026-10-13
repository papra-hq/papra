import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const autoDocumentDateOrganizationSettingsMigration = {
  name: 'auto-document-date-organization-settings',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(organization_settings)`);
    const existingColumns = tableInfo.rows.map((row) => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('ai_auto_document_date_enabled')) {
      await db.run(
        sql`ALTER TABLE "organization_settings" ADD COLUMN "ai_auto_document_date_enabled" integer`,
      );
    }
  },

  down: async ({ db }) => {
    await db.run(
      sql`ALTER TABLE "organization_settings" DROP COLUMN "ai_auto_document_date_enabled"`,
    );
  },
} satisfies Migration;
