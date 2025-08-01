import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createDocumentsRepository } from '../documents.repository';
import { extractAndSaveDocumentFileContent } from '../documents.usecases';
import { createDocumentStorageService } from '../storage/documents.storage.services';

export async function registerExtractDocumentFileContentTask({ taskServices, db, config }: { taskServices: TaskServices; db: Database; config: Config }) {
  const taskName = 'extract-document-file-content';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config });

      // TODO: remove type cast
      const { documentId, organizationId, ocrLanguages } = data as { documentId: string; organizationId: string; ocrLanguages: string[] };

      await extractAndSaveDocumentFileContent({
        documentId,
        organizationId,
        ocrLanguages,
        documentsRepository,
        documentsStorageService,
      });
    },
  });
}
