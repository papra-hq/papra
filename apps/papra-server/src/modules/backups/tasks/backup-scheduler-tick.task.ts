import type { GlobalDependencies } from '../../app/server.types';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createLogger } from '../../shared/logger/logger';
import { SCHEDULER_TICK_CRON } from '../backups.constants';
import { createBackupsRepository } from '../backups.repository';
import { createBackupsServices } from '../backups.services';
import { runDueScheduledBackupsUsecase } from '../backups.usecases';

const logger = createLogger({ namespace: 'backups:tasks:scheduler-tick' });

const TASK_NAME = 'backups.scheduler-tick';

export async function registerBackupSchedulerTickTask(deps: GlobalDependencies) {
  const { taskServices, config, db } = deps;

  if (!config.backups.kek || !config.backups.isSchedulerEnabled) {
    logger.info('Backup scheduler disabled (BACKUPS_KEK unset or BACKUPS_IS_SCHEDULER_ENABLED=false)');
    return;
  }

  await taskServices.registerTask({
    taskName: TASK_NAME,
    handler: async () => {
      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { triggeredCount } = await runDueScheduledBackupsUsecase({
        config,
        services,
        repository,
        documentsRepository,
        globalDeps: deps,
        logger,
      });

      if (triggeredCount > 0) {
        logger.info({ triggeredCount }, 'Triggered scheduled backups');
      }
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: TASK_NAME,
    taskName: TASK_NAME,
    cron: SCHEDULER_TICK_CRON,
  });
}
