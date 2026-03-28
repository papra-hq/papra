import { createPrefixedIdRegex } from '../shared/random/ids';

export const kanbanTaskIdPrefix = 'ktsk';
export const kanbanTaskIdRegex = createPrefixedIdRegex({ prefix: kanbanTaskIdPrefix });

export const kanbanTaskStatuses = ['todo', 'in-progress', 'done'] as const;
export type KanbanTaskStatus = typeof kanbanTaskStatuses[number];
