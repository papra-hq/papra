import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';
import { getRuntimeTableColumns } from '../../modules/app/database/database.usecases';

export const documentsNotesMigration = {
  name: 'documents-notes',

  up: async ({ db }) => {
    const existingColumns = await getRuntimeTableColumns({ tableName: 'documents', db });
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('notes')) {
      await db.run(sql`ALTER TABLE documents ADD COLUMN notes TEXT`);
    }
  },

  down: async ({ db }) => {
    await db.run(sql`ALTER TABLE documents DROP COLUMN notes`);
  },
} satisfies Migration;
