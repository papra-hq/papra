import type { Database } from '../app/database/database.types';
import type { KanbanTaskStatus } from './kanban-tasks.constants';
import { injectArguments } from '@corentinth/chisels';
import { and, eq } from 'drizzle-orm';
import { omitUndefined } from '../shared/utils';
import { kanbanTasksTable } from './kanban-tasks.table';

export type KanbanTasksRepository = ReturnType<typeof createKanbanTasksRepository>;

export function createKanbanTasksRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationKanbanTasks,
      getKanbanTaskById,
      createKanbanTask,
      updateKanbanTask,
      deleteKanbanTask,
      updateKanbanTaskStatus,
    },
    { db },
  );
}

async function getOrganizationKanbanTasks({ organizationId, db }: { organizationId: string; db: Database }) {
  const tasks = await db
    .select()
    .from(kanbanTasksTable)
    .where(eq(kanbanTasksTable.organizationId, organizationId))
    .orderBy(kanbanTasksTable.displayOrder);

  return { tasks };
}

async function getKanbanTaskById({ taskId, organizationId, db }: { taskId: string; organizationId: string; db: Database }) {
  const [task] = await db
    .select()
    .from(kanbanTasksTable)
    .where(
      and(
        eq(kanbanTasksTable.id, taskId),
        eq(kanbanTasksTable.organizationId, organizationId),
      ),
    );

  return { task };
}

async function createKanbanTask({ task, db }: {
  task: {
    title: string;
    description?: string | null;
    status?: KanbanTaskStatus;
    displayOrder?: number;
    organizationId: string;
    createdBy?: string | null;
  };
  db: Database;
}) {
  const [createdTask] = await db
    .insert(kanbanTasksTable)
    .values(task)
    .returning();

  return { task: createdTask };
}

async function updateKanbanTask({ taskId, title, description, status, displayOrder, db }: {
  taskId: string;
  title?: string;
  description?: string | null;
  status?: KanbanTaskStatus;
  displayOrder?: number;
  db: Database;
}) {
  const [task] = await db
    .update(kanbanTasksTable)
    .set(omitUndefined({
      title,
      description,
      status,
      displayOrder,
      updatedAt: new Date(),
    }))
    .where(eq(kanbanTasksTable.id, taskId))
    .returning();

  return { task };
}

async function deleteKanbanTask({ taskId, db }: { taskId: string; db: Database }) {
  await db.delete(kanbanTasksTable).where(eq(kanbanTasksTable.id, taskId));
}

async function updateKanbanTaskStatus({ taskId, status, displayOrder, db }: {
  taskId: string;
  status: KanbanTaskStatus;
  displayOrder: number;
  db: Database;
}) {
  const [task] = await db
    .update(kanbanTasksTable)
    .set({
      status,
      displayOrder,
      updatedAt: new Date(),
    })
    .where(eq(kanbanTasksTable.id, taskId))
    .returning();

  return { task };
}
