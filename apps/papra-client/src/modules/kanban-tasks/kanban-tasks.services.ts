import type { AsDto } from '../shared/http/http-client.types';
import type { KanbanTask, KanbanTaskStatus } from './kanban-tasks.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchKanbanTasks({ organizationId }: { organizationId: string }) {
  const { tasks } = await apiClient<{ tasks: AsDto<KanbanTask>[] }>({
    path: `/api/organizations/${organizationId}/kanban-tasks`,
    method: 'GET',
  });

  return {
    tasks: tasks.map(coerceDates),
  };
}

export async function createKanbanTask({ organizationId, title, description, status }: {
  organizationId: string;
  title: string;
  description?: string;
  status?: KanbanTaskStatus;
}) {
  const { task } = await apiClient<{ task: AsDto<KanbanTask> }>({
    path: `/api/organizations/${organizationId}/kanban-tasks`,
    method: 'POST',
    body: { title, description, status },
  });

  return {
    task: coerceDates(task),
  };
}

export async function updateKanbanTask({ organizationId, taskId, title, description, status, displayOrder }: {
  organizationId: string;
  taskId: string;
  title?: string;
  description?: string;
  status?: KanbanTaskStatus;
  displayOrder?: number;
}) {
  const { task } = await apiClient<{ task: AsDto<KanbanTask> }>({
    path: `/api/organizations/${organizationId}/kanban-tasks/${taskId}`,
    method: 'PUT',
    body: { title, description, status, displayOrder },
  });

  return {
    task: coerceDates(task),
  };
}

export async function deleteKanbanTask({ organizationId, taskId }: { organizationId: string; taskId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/kanban-tasks/${taskId}`,
    method: 'DELETE',
  });
}

export async function updateKanbanTaskStatus({ organizationId, taskId, status, displayOrder }: {
  organizationId: string;
  taskId: string;
  status: KanbanTaskStatus;
  displayOrder: number;
}) {
  const { task } = await apiClient<{ task: AsDto<KanbanTask> }>({
    path: `/api/organizations/${organizationId}/kanban-tasks/${taskId}/status`,
    method: 'PATCH',
    body: { status, displayOrder },
  });

  return {
    task: coerceDates(task),
  };
}
