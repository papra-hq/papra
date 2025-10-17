import type { Database } from '../../app/database/database.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createDocumentActivityRepository } from '../../documents/document-activity/document-activity.repository';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createLogger } from '../../shared/logger/logger';
import { createTagsRepository } from '../../tags/tags.repository';
import { createWebhookRepository } from '../../webhooks/webhook.repository';
import { createTaggingRulesRepository } from '../tagging-rules.repository';
import { applyTaggingRuleToExistingDocuments } from '../tagging-rules.usecases';

const logger = createLogger({ namespace: 'tasks:apply-tagging-rule' });

export async function registerApplyTaggingRuleToDocumentsTask({ taskServices, db }: { taskServices: TaskServices; db: Database }) {
  const taskName = 'apply-tagging-rule-to-documents';

  taskServices.registerTask({
    taskName,
    handler: async ({ data }) => {
      const documentsRepository = createDocumentsRepository({ db });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
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
        webhookRepository,
        documentActivityRepository,
        logger,
      });

      logger.info({ organizationId, taggingRuleId, result }, 'Completed background task to apply tagging rule');

      return result;
    },
  });
}
