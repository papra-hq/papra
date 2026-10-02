import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import type { Config } from '../../config/config.types';
import type { EventServices } from '../../app/events/events.services';
import type { AiServices } from '../../ai/ai.services';
import { createCustomPropertiesRepository } from '../../custom-properties/custom-properties.repository';
import { createCustomPropertiesOptionsRepository } from '../../custom-properties/options/custom-properties-options.repository';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { createOrganizationSettingsRepository } from '../../organizations/organization-settings/organization-settings.repository';
import { createResolveOrganizationSettingsUsecase } from '../../organizations/organization-settings/organization-settings.usecases';
import { extractDocumentMetadata } from '../../ai-extraction/ai-extraction.usecases';

export async function registerExtractDocumentMetadataTask({
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
  if (!config.ai.isEnabled || !config.aiExtraction.isEnabled) {
    return;
  }

  const taskName = 'extract-document-metadata';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

      const { documentId, organizationId } = data as {
        documentId: string;
        organizationId: string;
      };

      await extractDocumentMetadata({
        documentId,
        organizationId,
        aiServices,
        documentsRepository,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
        organizationsRepository,
        eventServices,
        resolveOrganizationSettings: createResolveOrganizationSettingsUsecase({
          config,
          organizationSettingsRepository,
        }),
      });
    },
  });
}
