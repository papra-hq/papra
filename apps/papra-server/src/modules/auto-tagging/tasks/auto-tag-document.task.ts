import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createTagsRepository } from '../../tags/tags.repository';
import { autoTagDocument } from '../../auto-tagging/auto-tagging.usecases';
import { createResolveOrganizationSettingsUsecase } from '../../organizations/organization-settings/organization-settings.usecases';
import { createOrganizationSettingsRepository } from '../../organizations/organization-settings/organization-settings.repository';
import type { Config } from '../../config/config.types';
import { createDocumentsRepository } from '../../documents/documents.repository';
import type { EventServices } from '../../app/events/events.services';
import type { AiServices } from '../../ai/ai.services';

export async function registerAutoTagDocumentTask({
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
  if (!config.ai.aiIsEnabled) {
    return;
  }

  const taskName = 'auto-tag-document';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

      // TODO: remove type cast
      const { documentId, organizationId } = data as {
        documentId: string;
        organizationId: string;
      };

      await autoTagDocument({
        documentId,
        organizationId,
        aiServices,
        documentsRepository,
        tagsRepository,
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
