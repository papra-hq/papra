import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import type { KvStore } from '../kv-store.types';
import { createLogger } from '../../shared/logger/logger';
import { isNil } from '../../shared/utils';

const logger = createLogger({ namespace: 'kv-store:tasks:purgeExpiredEntries' });

export async function registerPurgeExpiredKvEntriesTask({
  taskServices,
  kvStore,
  config,
}: {
  taskServices: TaskServices;
  kvStore: KvStore;
  config: Config;
}) {
  const taskName = 'purge-expired-kv-entries';
  const { cron, runOnStartup } = config.tasks.purgeExpiredKvEntries;

  const { purgeExpired } = kvStore;

  // Drivers that evict eagerly (e.g. in-memory) don't accumulate expired entries, so there's nothing to purge.
  if (isNil(purgeExpired)) {
    logger.debug(
      'Kv-store driver does not require expired entry purging, skipping task registration',
    );
    return;
  }

  taskServices.registerTask({
    taskName,
    handler: async () => {
      const { deletedCount } = await purgeExpired();

      logger.info({ deletedCount }, 'Purged expired kv-store entries');
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: `periodic-${taskName}`,
    taskName,
    cron,
    immediate: runOnStartup,
  });

  logger.info({ taskName, cron, runOnStartup }, 'Purge expired kv-store entries task registered');
}
