import type { BatchItem } from 'drizzle-orm/batch';
import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const documentFileEncryptionMigration = {
  name: 'document-file-encryption',

  up: async ({ db }) => {
    // Check if columns already exist to handle reapplying migrations
    const tableInfo = await db.run(sql`PRAGMA table_info(documents)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    const statements = [
      ...(!hasColumn('file_encryption_key_wrapped') ? [sql`ALTER TABLE documents ADD COLUMN file_encryption_key_wrapped TEXT`] : []),
      ...(!hasColumn('file_encryption_kek_version') ? [sql`ALTER TABLE documents ADD COLUMN file_encryption_kek_version TEXT`] : []),
      ...(!hasColumn('file_encryption_algorithm') ? [sql`ALTER TABLE documents ADD COLUMN file_encryption_algorithm TEXT`] : []),
      sql`CREATE INDEX IF NOT EXISTS documents_file_encryption_kek_version_index ON documents (file_encryption_kek_version)`,
    ];

    await db.batch(statements.map(statement => db.run(statement) as BatchItem<'sqlite'>) as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP INDEX IF EXISTS documents_file_encryption_kek_version_index`),
      db.run(sql`ALTER TABLE documents DROP COLUMN file_encryption_key_wrapped`),
      db.run(sql`ALTER TABLE documents DROP COLUMN file_encryption_kek_version`),
      db.run(sql`ALTER TABLE documents DROP COLUMN file_encryption_algorithm`),
    ]);
  },
} satisfies Migration;
