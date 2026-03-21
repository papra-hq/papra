import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const documentsNotesMigration = {
  name: 'documents-notes',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(documents)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('notes')) {
      await db.run(sql`ALTER TABLE documents ADD COLUMN notes TEXT`);
    }
  },

  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE documents DROP COLUMN notes`);
  },
} satisfies Migration;
