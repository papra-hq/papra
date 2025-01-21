import { primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { documentsTable } from '../documents/documents.table';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';

export const tagsTable = sqliteTable(
  'tags',
  {
    ...createPrimaryKeyField({ prefix: 'tag' }),
    ...createTimestampColumns(),

    organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
    description: text('description'),
  },
  table => [
    // To ensure that tags are unique per organization
    unique('tags_organization_id_name_unique').on(table.organizationId, table.name),
  ],
);

export const documentsTagsTable = sqliteTable(
  'documents_tags',
  {
    documentId: text('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagId: text('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  table => [
    primaryKey({
      name: 'documents_tags_pkey',
      columns: [table.documentId, table.tagId],
    }),
  ],
);
