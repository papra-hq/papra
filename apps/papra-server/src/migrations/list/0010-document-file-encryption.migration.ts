import type { Migration } from '../migrations.types';
import { sql } from 'kysely';

export const documentFileEncryptionMigration = {
  name: 'document-file-encryption',

  up: async ({ db }) => {
    // Check if columns already exist to handle reapplying migrations
    const tableInfo = await db.executeQuery<{ name: string }>(sql`PRAGMA table_info(documents)`.compile(db));
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('file_encryption_key_wrapped')) {
      await db.schema
        .alterTable('documents')
        .addColumn('file_encryption_key_wrapped', 'text')
        .execute();
    }

    if (!hasColumn('file_encryption_kek_version')) {
      await db.schema
        .alterTable('documents')
        .addColumn('file_encryption_kek_version', 'text')
        .execute();
    }

    if (!hasColumn('file_encryption_algorithm')) {
      await db.schema
        .alterTable('documents')
        .addColumn('file_encryption_algorithm', 'text')
        .execute();
    }

    await db.schema
      .createIndex('documents_file_encryption_kek_version_index')
      .ifNotExists()
      .on('documents')
      .column('file_encryption_kek_version')
      .execute();
  },

  down: async ({ db }) => {
    await db.schema.dropIndex('documents_file_encryption_kek_version_index').ifExists().execute();

    await db.schema.alterTable('documents').dropColumn('file_encryption_key_wrapped').execute();
    await db.schema.alterTable('documents').dropColumn('file_encryption_kek_version').execute();
    await db.schema.alterTable('documents').dropColumn('file_encryption_algorithm').execute();
  },
} satisfies Migration;
