import type { Config } from '../config/config.types';
import { createCadence } from '@cadence-mq/core';
import { createMemoryDriver } from '@cadence-mq/driver-memory';
import { createLogger } from '../shared/logger/logger';

export type TaskServices = ReturnType<typeof createTaskServices>;

const logger = createLogger({ namespace: 'tasks:services' });

export function createTaskServices({ config }: { config: Config }) {
  const workerId = config.tasks.worker.id ?? 'default';

  const driver = createMemoryDriver();
  const cadence = createCadence({ driver, logger });

  return {
    ...cadence,
    start: () => {
      const worker = cadence.createWorker({ workerId });

      worker.start();

      logger.info({ workerId }, 'Task worker started');

      return worker;
    },
  };
}
