import { createErrorFactory } from '../shared/errors/errors';

export const createKanbanTaskNotFoundError = createErrorFactory({
  message: 'Kanban task not found',
  code: 'kanban_tasks.not_found',
  statusCode: 404,
});
