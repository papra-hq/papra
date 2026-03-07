import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const documentsDateMigration = {
  name: 'documents-date',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(documents)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('document_date')) {
      await db.run(sql`ALTER TABLE documents ADD COLUMN document_date INTEGER`);
    }

    await db.run(sql`CREATE INDEX IF NOT EXISTS documents_organization_id_document_date_index ON documents(organization_id, document_date)`);
  },

  down: async ({ db }) => {
    await db.run(sql`DROP INDEX IF EXISTS documents_organization_id_document_date_index`);
    await db.run(sql`ALTER TABLE documents DROP COLUMN document_date`);
  },
} satisfies Migration;
