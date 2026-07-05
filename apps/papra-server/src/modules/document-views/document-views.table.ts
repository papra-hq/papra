import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { DOCUMENT_VIEW_ID_PREFIX } from './document-views.constants';

export const documentViewsTable = sqliteTable('document_views', {
  ...createPrimaryKeyField({ prefix: DOCUMENT_VIEW_ID_PREFIX }),
  ...createTimestampColumns(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  name: text('name').notNull(),
  query: text('query').notNull(),
  description: text('description'),
});
