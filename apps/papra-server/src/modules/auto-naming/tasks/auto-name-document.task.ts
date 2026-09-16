import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { autoNameDocument } from '../../auto-naming/auto-naming.usecases';
import { createResolveOrganizationSettingsUsecase } from '../../organizations/organization-settings/organization-settings.usecases';
import { createOrganizationSettingsRepository } from '../../organizations/organization-settings/organization-settings.repository';
import type { Config } from '../../config/config.types';
import { createDocumentsRepository } from '../../documents/documents.repository';
import type { EventServices } from '../../app/events/events.services';
import type { AiServices } from '../../ai/ai.services';

export async function registerAutoNameDocumentTask({
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
  if (!config.ai.isEnabled || !config.autoNaming.isEnabled) {
    return;
  }

  const taskName = 'auto-name-document';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

      const { documentId, organizationId } = data as {
        documentId: string;
        organizationId: string;
      };

      await autoNameDocument({
        documentId,
        organizationId,
        aiServices,
        documentsRepository,
        config,
        resolveOrganizationSettings: createResolveOrganizationSettingsUsecase({
          config,
          organizationSettingsRepository,
        }),
        eventServices,
      });
    },
  });
}
