import type { TaskPersistenceConfig, TaskServiceDriverDefinition } from '../../tasks.types';
import { createLibSqlDriver, setupSchema } from '@cadence-mq/driver-libsql';
import { safely } from '@corentinth/chisels';
import { createClient } from '@libsql/client';
import { createLogger } from '../../../shared/logger/logger';

const logger = createLogger({ namespace: 'tasks-driver:libsql' });

export function createLibSqlTaskServiceDriver({ taskPersistenceConfig }: { taskPersistenceConfig: TaskPersistenceConfig }): TaskServiceDriverDefinition {
  const { url, authToken, pollIntervalMs, migrateWithPragma } = taskPersistenceConfig.drivers.libSql;

  const client = createClient({ url, authToken });
  const driver = createLibSqlDriver({ client, pollIntervalMs });

  return {
    driver,
    initialize: async () => {
      logger.debug('Initializing LibSQL task service driver');
      const [, error] = await safely(setupSchema({ client, withPragma: migrateWithPragma }));

      if (error) {
        logger.error({ error }, 'Failed to set up LibSQL task service schema');
        throw error;
      }

      logger.info('LibSQL task service driver initialized');
    },
  };
}
