import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { TaskServices } from '../../tasks/tasks.services';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createLogger } from '../../shared/logger/logger';
import { createTagsRepository } from '../../tags/tags.repository';
import { createTaggingRulesRepository } from '../tagging-rules.repository';
import { applyTaggingRuleToExistingDocuments } from '../tagging-rules.usecases';

const logger = createLogger({ namespace: 'tasks:apply-tagging-rule' });

export async function registerApplyTaggingRuleToDocumentsTask({
  taskServices,
  db,
  eventServices,
}: {
  taskServices: TaskServices;
  db: Database;
  eventServices: EventServices;
}) {
  const taskName = 'apply-tagging-rule-to-documents';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      // TODO: remove type cast once taskServices has proper typing
      const { organizationId, taggingRuleId } = data as {
        organizationId: string;
        taggingRuleId: string;
      };

      logger.info(
        { organizationId, taggingRuleId },
        'Starting background task to apply tagging rule',
      );

      const result = await applyTaggingRuleToExistingDocuments({
        taggingRuleId,
        organizationId,
        taggingRulesRepository,
        documentsRepository,
        tagsRepository,
        eventServices,
        logger,
      });

      logger.info(
        { organizationId, taggingRuleId, result },
        'Completed background task to apply tagging rule',
      );

      return result;
    },
  });
}
