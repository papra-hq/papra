import type { AiServices } from '../../ai/ai.services';
import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createCustomPropertiesRepository } from '../../custom-properties/custom-properties.repository';
import { createCustomPropertiesOptionsRepository } from '../../custom-properties/options/custom-properties-options.repository';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { createTagsRepository } from '../../tags/tags.repository';
import { RECEIPT_EXTRACTION_TASK_NAME } from '../receipt-extraction.constants';
import { isReceiptExtractionEnabled } from '../receipt-extraction.models';
import { extractReceiptData } from '../receipt-extraction.usecases';

export async function registerExtractReceiptDataTask({
  taskServices,
  aiServices,
  db,
  config,
  eventServices,
}: {
  taskServices: TaskServices;
  aiServices: AiServices;
  db: Database;
  config: Config;
  eventServices: EventServices;
}) {
  if (!isReceiptExtractionEnabled({ config })) {
    return;
  }

  taskServices.registerTask({
    taskName: RECEIPT_EXTRACTION_TASK_NAME,
    handler: async ({ data }) => {
      // TODO: remove type cast, same as other tasks
      const { documentId, organizationId } = data as {
        documentId: string;
        organizationId: string;
      };

      await extractReceiptData({
        documentId,
        organizationId,
        aiServices,
        documentsRepository: createDocumentsRepository({ db }),
        customPropertiesRepository: createCustomPropertiesRepository({ db }),
        customPropertiesOptionsRepository: createCustomPropertiesOptionsRepository({ db }),
        organizationsRepository: createOrganizationsRepository({ db }),
        tagsRepository: createTagsRepository({ db }),
        eventServices,
        config,
      });
    },
  });
}
