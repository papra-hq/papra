import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createTagsRepository } from '../../tags/tags.repository';
import { buildApplyAutoTaggingActions } from '../../auto-tagging/auto-tagging.usecases';
import { applyTagsToDocuments, createTag } from '../../tags/tags.usecases';
import { createLogger } from '../../shared/logger/logger';
import { createResolveOrganizationSettingsUsecase } from '../../organizations/organization-settings/organization-settings.usecases';
import { createOrganizationSettingsRepository } from '../../organizations/organization-settings/organization-settings.repository';
import type { Config } from '../../config/config.types';
import { createDocumentsRepository } from '../../documents/documents.repository';
import type { EventServices } from '../../app/events/events.services';
import type { AiServices } from '../../ai/ai.services';
import { buildEnrichDocument } from '../document-enrichment.usecases';
import type { DocumentEnrichmentCapability } from '../document-enrichment.schemas';
import { buildTagsEnrichmentCapability } from '../enrichment-capabilities/tags/tags.enrichment-capability';

export async function registerEnrichDocumentTask({
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
  if (!config.ai.isEnabled || !config.autoTagging.isEnabled) {
    return;
  }

  const taskName = 'enrich-document';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

      // TODO: remove type cast
      const { documentId, organizationId, capabilities } = data as {
        documentId: string;
        organizationId: string;
        capabilities?: DocumentEnrichmentCapability[];
      };

      const logger = createLogger({ namespace: 'documentEnrichment' });
      const enrichDocument = buildEnrichDocument({
        documentsRepository,
        tagsRepository,
        logger,
        capabilityDefinitions: [
          buildTagsEnrichmentCapability({
            config,
            applyAutoTaggingActions: buildApplyAutoTaggingActions({
              createTag: async (args) => createTag({ ...args, config, tagsRepository }),
              applyTagsToDocuments: async (args) =>
                applyTagsToDocuments({ ...args, tagsRepository, eventServices, logger }),
            }),
          }),
        ],
        resolveOrganizationSettings: createResolveOrganizationSettingsUsecase({
          config,
          organizationSettingsRepository,
        }),
        aiServices,
      });

      await enrichDocument({ documentId, organizationId, capabilities });
    },
  });
}
