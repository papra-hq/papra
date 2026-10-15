import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createTagsRepository } from '../../tags/tags.repository';
import { autoProcessDocument } from '../auto-processing.usecases';
import { createResolveOrganizationSettingsUsecase } from '../../organizations/organization-settings/organization-settings.usecases';
import { createOrganizationSettingsRepository } from '../../organizations/organization-settings/organization-settings.repository';
import type { Config } from '../../config/config.types';
import { createDocumentsRepository } from '../../documents/documents.repository';
import type { EventServices } from '../../app/events/events.services';
import type { AiServices } from '../../ai/ai.services';
import { isAutoProcessingEnabled } from '../auto-processing.config.models';

export async function registerAutoProcessDocumentTask({
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
  if (!isAutoProcessingEnabled({ config })) {
    return;
  }

  // Jobs queued before auto-naming was added use the former auto-tagging task name
  const taskNames = ['auto-process-document', 'auto-tag-document'];

  const handler: Parameters<TaskServices['registerTask']>[0]['handler'] = async ({ data }) => {
    const documentsRepository = createDocumentsRepository({ db });
    const tagsRepository = createTagsRepository({ db });
    const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

    // TODO: remove type cast
    const { documentId, organizationId } = data as {
      documentId: string;
      organizationId: string;
    };

    await autoProcessDocument({
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
  };

  for (const taskName of taskNames) {
    taskServices.registerTask({ taskName, handler });
  }
}
