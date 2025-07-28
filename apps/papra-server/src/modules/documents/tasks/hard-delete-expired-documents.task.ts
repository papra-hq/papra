import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createLogger } from '../../shared/logger/logger';
import { createDocumentsRepository } from '../documents.repository';
import { deleteExpiredDocuments } from '../documents.usecases';
import { createDocumentStorageService } from '../storage/documents.storage.services';

const logger = createLogger({ namespace: 'documents:tasks:hardDeleteExpiredDocuments' });

export async function registerHardDeleteExpiredDocumentsTask({ taskServices, db, config }: { taskServices: TaskServices; db: Database; config: Config }) {
  const taskName = 'hard-delete-expired-documents';
  const { cron, runOnStartup } = config.tasks.hardDeleteExpiredDocuments;

  taskServices.registerTask({
    taskName,
    handler: async () => {
      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config });

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
