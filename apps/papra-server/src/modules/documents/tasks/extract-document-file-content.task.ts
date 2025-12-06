import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { TaskServices } from '../../tasks/tasks.services';
import type { DocumentStorageService } from '../storage/documents.storage.services';
import { createTaggingRulesRepository } from '../../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../../tags/tags.repository';
import { createWebhookRepository } from '../../webhooks/webhook.repository';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { createDocumentsRepository } from '../documents.repository';
import { extractAndSaveDocumentFileContent } from '../documents.usecases';

export async function registerExtractDocumentFileContentTask({
  taskServices,
  db,
  documentsStorageService,
  eventServices,
}: {
  taskServices: TaskServices;
  db: Database;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
}) {
  const taskName = 'extract-document-file-content';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
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
        taggingRulesRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
        eventServices,
      });
    },
  });
}
