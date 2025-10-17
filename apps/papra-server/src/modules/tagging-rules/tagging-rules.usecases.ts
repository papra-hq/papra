import type { DocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { Document } from '../documents/documents.types';
import type { Logger } from '../shared/logger/logger';
import type { TagsRepository } from '../tags/tags.repository';
import type { Tag } from '../tags/tags.types';
import type { WebhookRepository } from '../webhooks/webhook.repository';
import type { TaggingRuleOperatorValidatorRegistry } from './conditions/tagging-rule-conditions.registry';
import type { TaggingRulesRepository } from './tagging-rules.repository';
import type { TaggingRuleField, TaggingRuleOperator } from './tagging-rules.types';
import { safely, safelySync } from '@corentinth/chisels';
import { uniq } from 'lodash-es';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { isNil } from '../shared/utils';
import { addTagToDocument } from '../tags/tags.usecases';
import { createTaggingRuleOperatorValidatorRegistry } from './conditions/tagging-rule-conditions.registry';
import { getDocumentFieldValue } from './tagging-rules.models';

export async function createTaggingRule({
  name,
  description,
  enabled,
  conditions,
  tagIds,
  organizationId,

  taggingRulesRepository,
}: {
  name: string;
  description: string | undefined;
  enabled: boolean | undefined;
  conditions: {
    field: TaggingRuleField;
    operator: TaggingRuleOperator;
    value: string;
  }[];
  tagIds: string[];
  organizationId: string;

  taggingRulesRepository: TaggingRulesRepository;
}) {
  const { taggingRule } = await taggingRulesRepository.createTaggingRule({
    taggingRule: {
      name,
      description,
      enabled,
      organizationId,
    },
  });

  const { id: taggingRuleId } = taggingRule;

  await Promise.all([
    conditions.length > 0 && taggingRulesRepository.createTaggingRuleConditions({ taggingRuleId, conditions }),
    taggingRulesRepository.createTaggingRuleActions({ taggingRuleId, tagIds }),
  ]);
}

export async function applyTaggingRules({
  document,

  taggingRulesRepository,
  tagsRepository,
  webhookRepository,
  documentActivityRepository,
  taggingRuleOperatorValidatorRegistry = createTaggingRuleOperatorValidatorRegistry(),
  logger = createLogger({ namespace: 'tagging-rules' }),
}: {
  document: Document;

  taggingRulesRepository: TaggingRulesRepository;
  taggingRuleOperatorValidatorRegistry?: TaggingRuleOperatorValidatorRegistry;
  tagsRepository: TagsRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
  logger?: Logger;
}) {
  const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: document.organizationId });

  const taggingRulesToApplyActions = taggingRules.filter(taggingRule => taggingRule.conditions.every(({ operator, field, value: conditionValue, isCaseSensitive }) => {
    const { validate } = taggingRuleOperatorValidatorRegistry.getTaggingRuleOperatorValidator({ operator });
    const { fieldValue } = getDocumentFieldValue({ document, field });

    const [isValid, error] = safelySync(() => validate({ conditionValue, fieldValue, isCaseSensitive }));

    if (error) {
      logger.error({ error, conditionValue, fieldValue, isCaseSensitive }, 'Failed to validate tagging rule condition');

      return false;
    }

    return isValid;
  }));

  const tagsToApply: Tag[] = uniq(taggingRulesToApplyActions.flatMap(taggingRule => taggingRule.actions.map(action => action.tag).filter(tag => !isNil(tag))));
  const tagIdsToApply = tagsToApply.map(tag => tag.id);

  const appliedTagIdsResults = await Promise.all(tagsToApply.map(async (tag) => {
    const [, error] = await safely(async () => addTagToDocument({
      tagId: tag.id,
      documentId: document.id,
      organizationId: document.organizationId,
      tag,
      tagsRepository,
      webhookRepository,
      documentActivityRepository,
    }));

    if (error) {
      logger.error({ error, tagId: tag.id, documentId: document.id }, 'Failed to add tag to document');

      return undefined;
    }

    return tag.id;
  }));

  const appliedTagIds = appliedTagIdsResults.filter((id): id is string => id !== undefined);

  logger.info({
    taggingRulesIdsToApply: taggingRulesToApplyActions.map(taggingRule => taggingRule.id),
    appliedTagIds,
    tagIdsToApply,
    hasAllTagBeenApplied: appliedTagIds.length === tagIdsToApply.length,
  }, 'Tagging rules applied');
}

export async function applyTaggingRuleToExistingDocuments({
  taggingRuleId,
  organizationId,
  taggingRulesRepository,
  documentsRepository,
  tagsRepository,
  webhookRepository,
  documentActivityRepository,
  logger = createLogger({ namespace: 'tagging-rules' }),
}: {
  taggingRuleId: string;
  organizationId: string;
  taggingRulesRepository: TaggingRulesRepository;
  documentsRepository: DocumentsRepository;
  tagsRepository: TagsRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
  logger?: Logger;
}) {
  // Verify the tagging rule exists and belongs to the organization
  const { taggingRule } = await taggingRulesRepository.getOrganizationTaggingRule({ organizationId, taggingRuleId });

  if (!taggingRule) {
    throw createError({
      message: 'Tagging rule not found',
      code: 'tagging-rules.not-found',
      statusCode: 404,
    });
  }

  logger.info({ organizationId, taggingRuleId }, 'Starting to apply tagging rule to existing documents');

  // Use iterator to fetch documents in batches
  const documentsIterator = documentsRepository.getAllOrganizationUndeletedDocumentsIterator({ organizationId, batchSize: 100 });

  let processedCount = 0;
  let taggedCount = 0;
  let errorCount = 0;

  // Process documents one by one using the iterator
  for await (const document of documentsIterator) {
    const [, error] = await safely(async () => {
      await applyTaggingRules({
        document,
        taggingRulesRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
        logger,
      });

      // Count as tagged - applyTaggingRules processes all enabled rules
      taggedCount++;
    });

    if (error) {
      errorCount++;
      logger.error({ error, documentId: document.id }, 'Error applying tagging rule to document');
    }

    processedCount++;

    // Log progress every 100 documents
    if (processedCount % 100 === 0) {
      logger.info({ organizationId, taggingRuleId, processedCount, taggedCount, errorCount }, 'Progress update');
    }
  }

  logger.info({
    organizationId,
    taggingRuleId,
    processedCount,
    taggedCount,
    errorCount,
  }, 'Completed applying tagging rule to existing documents');

  return {
    processedCount,
    taggedCount,
    errorCount,
  };
}
