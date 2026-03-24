import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { viewIdPrefix } from './views.constants';

export const viewsTable = sqliteTable(
  'views',
  {
    ...createPrimaryKeyField({ prefix: viewIdPrefix }),
    ...createTimestampColumns(),

    organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    query: text('query').notNull(),
  },
  table => [
    unique('views_organization_id_name_unique').on(table.organizationId, table.name),
  ],
);
