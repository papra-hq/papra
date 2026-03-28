import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import { kanbanTaskIdPrefix } from './kanban-tasks.constants';

export const kanbanTasksTable = sqliteTable('kanban_tasks', {
  ...createPrimaryKeyField({ prefix: kanbanTaskIdPrefix }),
  ...createTimestampColumns(),

  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdBy: text('created_by').references(() => usersTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),

  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  displayOrder: integer('display_order').notNull().default(0),
}, table => [
  index('kanban_tasks_organization_id_status_index').on(table.organizationId, table.status),
  index('kanban_tasks_organization_id_display_order_index').on(table.organizationId, table.displayOrder),
]);
