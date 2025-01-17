import { defineTask } from '../../tasks/tasks.models';
import { createDocumentsRepository } from '../documents.repository';
import { deleteExpiredDocuments } from '../documents.usecases';
import { createDocumentStorageService } from '../storage/documents.storage.services';

export const hardDeleteExpiredDocumentsTaskDefinition = defineTask({
  name: 'hard-delete-expired-documents',
  isEnabled: ({ config }) => config.tasks.hardDeleteExpiredDocuments.enabled,
  cronSchedule: ({ config }) => config.tasks.hardDeleteExpiredDocuments.cron,
  runOnStartup: ({ config }) => config.tasks.hardDeleteExpiredDocuments.runOnStartup,
  handler: async ({ db, config, now, logger }) => {
    const documentsRepository = createDocumentsRepository({ db });
    const documentsStorageService = await createDocumentStorageService({ config });

    const { deletedDocumentsCount } = await deleteExpiredDocuments({
      config,
      documentsRepository,
      documentsStorageService,
      now,
    });

    logger.info({ deletedDocumentsCount }, 'Expired documents deleted');
  },
});
