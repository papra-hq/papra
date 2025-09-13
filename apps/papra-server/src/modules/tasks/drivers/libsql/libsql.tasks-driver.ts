import type { TaskPersistenceConfig, TaskServiceDriverDefinition } from '../../tasks.types';
import { createLibSqlDriver, setupSchema } from '@cadence-mq/driver-libsql';
import { createClient } from '@libsql/client';

export function createLibSqlTaskServiceDriver({ taskPersistenceConfig }: { taskPersistenceConfig: TaskPersistenceConfig }): TaskServiceDriverDefinition {
  const { url, authToken, pollIntervalMs } = taskPersistenceConfig.drivers.libSql;

  const client = createClient({ url, authToken });
  const driver = createLibSqlDriver({ client, pollIntervalMs });

  return {
    driver,
    initialize: async () => {
      await setupSchema({ client });
    },
  };
}
