import { sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { folderIdPrefix } from './folders.constants';

export const foldersTable = sqliteTable('folders', {
  ...createPrimaryKeyField({ prefix: folderIdPrefix }),
  ...createTimestampColumns(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  // Self-referencing FK: null parentId means the folder lives at the organization root.
  parentId: text('parent_id').references((): AnySQLiteColumn => foldersTable.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),

  name: text('name').notNull(),
});
