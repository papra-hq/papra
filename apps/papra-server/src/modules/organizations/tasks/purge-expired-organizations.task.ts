import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { DocumentStorageService } from '../../documents/storage/documents.storage.services';
import type { TaskServices } from '../../tasks/tasks.services';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createLogger } from '../../shared/logger/logger';
import { createOrganizationsRepository } from '../organizations.repository';
import { purgeExpiredSoftDeletedOrganizations } from '../organizations.usecases';

const logger = createLogger({ namespace: 'organizations:tasks:purgeExpiredOrganizations' });

export async function registerPurgeExpiredOrganizationsTask({ taskServices, db, config, documentsStorageService }: { taskServices: TaskServices; db: Database; config: Config; documentsStorageService: DocumentStorageService }) {
  const taskName = 'purge-expired-organizations';
  const { cron, runOnStartup } = config.tasks.purgeExpiredOrganizations;

  taskServices.registerTask({
    taskName,
    handler: async () => {
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { purgedOrganizationCount, totalOrganizationCount } = await purgeExpiredSoftDeletedOrganizations({
        organizationsRepository,
        documentsRepository,
        documentsStorageService,
        logger,
      });

      logger.info({ purgedOrganizationCount, totalOrganizationCount }, 'Purged expired soft-deleted organizations');
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: `periodic-${taskName}`,
    taskName,
    cron,
    immediate: runOnStartup,
  });

  logger.info({ taskName, cron, runOnStartup }, 'Purge expired organizations task registered');
}
