import type { BatchItem } from 'drizzle-orm/batch';
import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const documentPreviewFieldsMigration = {
    name: 'document-preview-fields',

    up: async ({ db }) => {
        // Check if columns already exist to handle reapplying migrations
        const tableInfo = await db.run(sql`PRAGMA table_info(documents)`);
        const existingColumns = tableInfo.rows.map(row => row.name);
        const hasColumn = (columnName: string) => existingColumns.includes(columnName);

        const statements = [
            ...(!hasColumn('preview_storage_key') ? [sql`ALTER TABLE documents ADD COLUMN preview_storage_key TEXT`] : []),
            ...(!hasColumn('preview_mime_type') ? [sql`ALTER TABLE documents ADD COLUMN preview_mime_type TEXT`] : []),
            ...(!hasColumn('preview_size') ? [sql`ALTER TABLE documents ADD COLUMN preview_size INTEGER`] : []),
            ...(!hasColumn('preview_generated_at') ? [sql`ALTER TABLE documents ADD COLUMN preview_generated_at INTEGER`] : []),
        ];

        if (statements.length > 0) {
            await db.batch(statements.map(statement => db.run(statement) as BatchItem<'sqlite'>) as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }
    },

    down: async ({ db }) => {
        await db.batch([
            db.run(sql`ALTER TABLE documents DROP COLUMN preview_storage_key`),
            db.run(sql`ALTER TABLE documents DROP COLUMN preview_mime_type`),
            db.run(sql`ALTER TABLE documents DROP COLUMN preview_size`),
            db.run(sql`ALTER TABLE documents DROP COLUMN preview_generated_at`),
        ]);
    },
} satisfies Migration;
