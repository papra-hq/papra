import { z } from 'zod';
import { kanbanTaskIdRegex, kanbanTaskStatuses } from './kanban-tasks.constants';

export const kanbanTaskIdSchema = z.string().regex(kanbanTaskIdRegex);
export const kanbanTaskStatusSchema = z.enum(kanbanTaskStatuses);
