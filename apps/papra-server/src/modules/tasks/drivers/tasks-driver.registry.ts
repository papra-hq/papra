import type { TaskServiceDriverFactory } from '../tasks.types';
import { createLibSqlTaskServiceDriver } from './libsql/libsql.tasks-driver';
import { createMemoryTaskServiceDriver } from './memory/memory.tasks-driver';
import { TASKS_DRIVER_NAMES } from './tasks-driver.constants';

export const tasksDrivers = {
  [TASKS_DRIVER_NAMES.memory]: createMemoryTaskServiceDriver,
  [TASKS_DRIVER_NAMES.libsql]: createLibSqlTaskServiceDriver,
} as const satisfies Record<string, TaskServiceDriverFactory>;
