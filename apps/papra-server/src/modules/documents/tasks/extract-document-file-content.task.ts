import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import type { DocumentStorageService } from '../storage/documents.storage.services';
import { createTaggingRulesRepository } from '../../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../../tags/tags.repository';
import { createWebhookRepository } from '../../webhooks/webhook.repository';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { createDocumentSearchServices } from '../document-search/document-search.registry';
import { createDocumentsRepository } from '../documents.repository';
import { extractAndSaveDocumentFileContent } from '../documents.usecases';

export async function registerExtractDocumentFileContentTask({ taskServices, db, config, documentsStorageService }: { taskServices: TaskServices; db: Database; config: Config; documentsStorageService: DocumentStorageService }) {
  const taskName = 'extract-document-file-content';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const documentSearchServices = createDocumentSearchServices({ db, config });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      // TODO: remove type cast
      const { documentId, organizationId, ocrLanguages } = data as { documentId: string; organizationId: string; ocrLanguages: string[] };

      await extractAndSaveDocumentFileContent({
        documentId,
        organizationId,
        ocrLanguages,
        documentsRepository,
        documentsStorageService,
        documentSearchServices,
        taggingRulesRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
      });
    },
  });
}
