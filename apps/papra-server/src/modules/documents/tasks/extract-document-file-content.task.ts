import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { TaskServices } from '../../tasks/tasks.services';
import type { DocumentStorageService } from '../storage/documents.storage.services';
import { createTaggingRulesRepository } from '../../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../../tags/tags.repository';
import { createDocumentsRepository } from '../documents.repository';
import { extractAndSaveDocumentFileContent } from '../documents.usecases';
import type { Config } from '../../config/config.types';

export async function registerExtractDocumentFileContentTask({
  taskServices,
  db,
  documentsStorageService,
  eventServices,
  config,
}: {
  taskServices: TaskServices;
  db: Database;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
  config: Config;
}) {
  const taskName = 'extract-document-file-content';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      // TODO: remove type cast
      const { documentId, organizationId, ocrLanguages } = data as {
        documentId: string;
        organizationId: string;
        ocrLanguages: string[];
      };

      await extractAndSaveDocumentFileContent({
        documentId,
        organizationId,
        ocrLanguages,
        documentsRepository,
        documentsStorageService,
        taggingRulesRepository,
        tagsRepository,
        eventServices,
      });

      if (!config.ai.isEnabled || !config.autoTagging.isEnabled) {
        return;
      }

      await taskServices.scheduleJob({
        taskName: 'auto-tag-document',
        data: { documentId, organizationId },
      });
    },
  });
}
