import type { Config } from '../config/config.types';
import { createCadence } from '@cadence-mq/core';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { isNil } from '../shared/utils';
import { tasksDrivers } from './drivers/tasks-driver.registry';

export type TaskServices = ReturnType<typeof createTaskServices>;

const logger = createLogger({ namespace: 'tasks:services' });

export function createTaskServices({ config }: { config: Config }) {
  const workerId = config.tasks.worker.id ?? 'default';
  const taskPersistenceConfig = config.tasks.persistence;
  const { driverName } = taskPersistenceConfig;

  const driverFactory = tasksDrivers[driverName];

  if (isNil(driverFactory)) {
    // Should not happen as the config validation should catch invalid driver names
    throw createError({
      message: `Invalid task service driver: ${driverName}`,
      code: 'tasks.invalid_driver',
      statusCode: 500,
      isInternal: true,
    });
  }

  const { driver, initialize } = driverFactory({ taskPersistenceConfig });
  const cadence = createCadence({ driver, logger });

  return {
    ...cadence,
    initialize: async () => {
      await initialize?.();
      logger.debug({ driverName }, 'Task persistence driver initialized');
    },
    start: () => {
      const worker = cadence.createWorker({ workerId });

      worker.start();

      logger.info({ workerId }, 'Task worker started');

      return worker;
    },
  };
}
