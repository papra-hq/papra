import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import type { DocumentStorageService } from '../storage/documents.storage.services';
import { createTaggingRulesRepository } from '../../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../../tags/tags.repository';
import { createDocumentsRepository } from '../documents.repository';
import { extractAndSaveDocumentFileContent } from '../documents.usecases';

export async function registerExtractDocumentFileContentTask({ taskServices, db, documentsStorageService }: { taskServices: TaskServices; db: Database; documentsStorageService: DocumentStorageService }) {
  const taskName = 'extract-document-file-content';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

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
      });
    },
  });
}
