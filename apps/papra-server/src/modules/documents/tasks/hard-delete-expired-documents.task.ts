import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import type { DocumentStorageService } from '../storage/documents.storage.services';
import { createLogger } from '../../shared/logger/logger';
import { createDocumentsRepository } from '../documents.repository';
import { deleteExpiredDocuments } from '../documents.usecases';

const logger = createLogger({ namespace: 'documents:tasks:hardDeleteExpiredDocuments' });

export async function registerHardDeleteExpiredDocumentsTask({ taskServices, db, config, documentsStorageService }: { taskServices: TaskServices; db: Database; config: Config; documentsStorageService: DocumentStorageService }) {
  const taskName = 'hard-delete-expired-documents';
  const { cron, runOnStartup } = config.tasks.hardDeleteExpiredDocuments;

  taskServices.registerTask({
    taskName,
    handler: async () => {
      const documentsRepository = createDocumentsRepository({ db });

      const { deletedDocumentsCount } = await deleteExpiredDocuments({
        config,
        documentsRepository,
        documentsStorageService,
      });

      logger.info({ deletedDocumentsCount }, 'Expired documents deleted');
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: `periodic-${taskName}`,
    taskName,
    cron,
    immediate: runOnStartup,
  });

  logger.info({ taskName, cron, runOnStartup }, 'Hard delete expired documents task registered');
}
