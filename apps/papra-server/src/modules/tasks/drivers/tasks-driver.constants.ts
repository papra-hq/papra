export const TASKS_DRIVER_NAMES = {
  memory: 'memory',
  libsql: 'libsql',
} as const;

export const tasksDriverNames = Object.keys(TASKS_DRIVER_NAMES);

export type TasksDriverName = keyof typeof TASKS_DRIVER_NAMES;
