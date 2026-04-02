import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';
import { createDocumentActivityRepository } from '../../documents/document-activity/document-activity.repository';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createLogger } from '../../shared/logger/logger';
import { createTagsRepository } from '../../tags/tags.repository';
import { createTaggingRulesRepository } from '../tagging-rules.repository';
import { applyTaggingRuleToExistingDocuments } from '../tagging-rules.usecases';

const logger = createLogger({ namespace: 'tasks:apply-tagging-rule' });

export async function registerApplyTaggingRuleToDocumentsTask({ taskServices, db, webhookTriggerServices }: { taskServices: TaskServices; db: Database; webhookTriggerServices: WebhookTriggerServices }) {
  const taskName = 'apply-tagging-rule-to-documents';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      // TODO: remove type cast once taskServices has proper typing
      const { organizationId, taggingRuleId } = data as { organizationId: string; taggingRuleId: string };

      logger.info({ organizationId, taggingRuleId }, 'Starting background task to apply tagging rule');

      const result = await applyTaggingRuleToExistingDocuments({
        taggingRuleId,
        organizationId,
        taggingRulesRepository,
        documentsRepository,
        tagsRepository,
        webhookTriggerServices,
        documentActivityRepository,
        logger,
      });

      logger.info({ organizationId, taggingRuleId, result }, 'Completed background task to apply tagging rule');

      return result;
    },
  });
}
