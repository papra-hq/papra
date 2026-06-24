import type { EventServices } from '../app/events/events.services';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { Document } from '../documents/documents.types';
import type { Logger } from '../shared/logger/logger';
import type { TagsRepository } from '../tags/tags.repository';
import type { Tag } from '../tags/tags.types';
import type { TaggingRuleOperatorValidatorRegistry } from './conditions/tagging-rule-conditions.registry';
import type { TaggingRulesRepository } from './tagging-rules.repository';
import type {
  ConditionMatchMode,
  TaggingRuleField,
  TaggingRuleOperator,
} from './tagging-rules.types';
import { safely, safelySync } from '@corentinth/chisels';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { isNil, uniq } from '../shared/utils';
import { applyTagsToDocuments } from '../tags/tags.usecases';
import { createTaggingRuleOperatorValidatorRegistry } from './conditions/tagging-rule-conditions.registry';
import { CONDITION_MATCH_MODES } from './tagging-rules.constants';
import { getDocumentFieldValue } from './tagging-rules.models';

export async function createTaggingRule({
  name,
  description,
  enabled,
  conditionMatchMode,
  conditions,
  tagIds,
  organizationId,

  taggingRulesRepository,
}: {
  name: string;
  description: string | undefined;
  enabled: boolean | undefined;
  conditionMatchMode: ConditionMatchMode | undefined;
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
      conditionMatchMode,
      organizationId,
    },
  });

  const { id: taggingRuleId } = taggingRule;

  await Promise.all([
    conditions.length > 0 &&
      taggingRulesRepository.createTaggingRuleConditions({ taggingRuleId, conditions }),
    taggingRulesRepository.createTaggingRuleActions({ taggingRuleId, tagIds }),
  ]);
}

/**
 * Apply a single tagging rule to a document.
 * Checks if the rule's conditions match the document, and if so, applies the rule's tags.
 * Returns the list of tag IDs that were successfully applied.
 */
export async function applyTaggingRule({
  document,
  taggingRule,
  tagsRepository,
  eventServices,
  taggingRuleOperatorValidatorRegistry = createTaggingRuleOperatorValidatorRegistry(),
  logger = createLogger({ namespace: 'tagging-rules' }),
}: {
  document: Document;
  taggingRule: {
    id: string;
    conditionMatchMode?: ConditionMatchMode;
    conditions: Array<{
      operator: string;
      field: string;
      value: string;
      isCaseSensitive: boolean;
    }>;
    actions: Array<{
      tag: Tag | null;
    }>;
  };
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  taggingRuleOperatorValidatorRegistry?: TaggingRuleOperatorValidatorRegistry;
  logger?: Logger;
}): Promise<{ appliedTagIds: string[] }> {
  // If there are no conditions, the rule always matches

  const hasConditions = taggingRule.conditions.length > 0;

  if (hasConditions) {
    // Validate each condition
    const validateCondition = (condition: {
      operator: string;
      field: string;
      value: string;
      isCaseSensitive: boolean;
    }) => {
      const { operator, field, value: conditionValue, isCaseSensitive } = condition;
      const { validate } = taggingRuleOperatorValidatorRegistry.getTaggingRuleOperatorValidator({
        operator,
      });
      const { fieldValue } = getDocumentFieldValue({ document, field });

      const [isValid, error] = safelySync(() =>
        validate({ conditionValue, fieldValue, isCaseSensitive }),
      );

      if (error) {
        logger.error(
          { error, conditionValue, fieldValue, isCaseSensitive },
          'Failed to validate tagging rule condition',
        );
        return false;
      }

      return isValid;
    };

    // Check if conditions match based on match mode (default to 'all' for backwards compatibility)
    const conditionsMatch =
      taggingRule.conditionMatchMode === CONDITION_MATCH_MODES.ANY
        ? taggingRule.conditions.some(validateCondition)
        : taggingRule.conditions.every(validateCondition);

    // If conditions don't match, return empty array
    if (!conditionsMatch) {
      return { appliedTagIds: [] };
    }
  }

  // Get tags to apply from the rule's actions
  const tagIdsToApply = uniq(
    taggingRule.actions
      .map((action) => action.tag)
      .filter((tag): tag is Tag => !isNil(tag))
      .map((tag) => tag.id),
  );

  // Apply all of the rule's tags in a single idempotent operation. Failures are swallowed so a
  // single faulty rule never breaks the document flow that triggered it.
  const [result, error] = await safely(async () =>
    applyTagsToDocuments({
      documentIds: [document.id],
      addTagIds: tagIdsToApply,
      organizationId: document.organizationId,
      tagsRepository,
      eventServices,
      logger,
    }),
  );

  if (error) {
    logger.error(
      { error, taggingRuleId: taggingRule.id, documentId: document.id },
      'Failed to apply tagging rule to document',
    );
    return { appliedTagIds: [] };
  }

  const appliedTagIds = uniq(result.insertedPairs.map(({ tagId }) => tagId));

  logger.info(
    {
      taggingRuleId: taggingRule.id,
      appliedTagIds,
      expectedTagCount: tagIdsToApply.length,
      hasAllTagBeenApplied: appliedTagIds.length === tagIdsToApply.length,
    },
    'Tagging rule applied to document',
  );

  return { appliedTagIds };
}

/**
 * Apply all enabled tagging rules to a document.
 * Fetches all enabled rules for the document's organization and applies each one.
 */
export async function applyTaggingRules({
  document,

  taggingRulesRepository,
  tagsRepository,
  eventServices,
  taggingRuleOperatorValidatorRegistry = createTaggingRuleOperatorValidatorRegistry(),
  logger = createLogger({ namespace: 'tagging-rules' }),
}: {
  document: Document;

  taggingRulesRepository: TaggingRulesRepository;
  taggingRuleOperatorValidatorRegistry?: TaggingRuleOperatorValidatorRegistry;
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  logger?: Logger;
}) {
  const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({
    organizationId: document.organizationId,
  });

  // Apply each enabled rule to the document
  const appliedTagIdsPerRule = await Promise.all(
    taggingRules.map(async (taggingRule) => {
      return applyTaggingRule({
        document,
        taggingRule,
        tagsRepository,
        eventServices,
        taggingRuleOperatorValidatorRegistry,
        logger,
      });
    }),
  );

  const allAppliedTagIds = uniq(
    appliedTagIdsPerRule.map(({ appliedTagIds }) => appliedTagIds).flat(),
  );

  logger.info(
    {
      taggingRulesCount: taggingRules.length,
      appliedTagIds: allAppliedTagIds,
    },
    'All tagging rules applied to document',
  );
}

type ProcessingStats = {
  processedCount: number;
  taggedDocumentsCount: number;
  errorCount: number;
};

async function processDocumentWithTaggingRule({
  document,
  taggingRule,
  tagsRepository,
  eventServices,
  logger,
}: {
  document: Document;
  taggingRule: {
    id: string;
    conditions: Array<{
      operator: string;
      field: string;
      value: string;
      isCaseSensitive: boolean;
    }>;
    actions: Array<{
      tag: Tag | null;
    }>;
  };
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  logger: Logger;
}) {
  const [result, error] = await safely(async () => {
    return applyTaggingRule({
      document,
      taggingRule,
      tagsRepository,
      eventServices,
      logger,
    });
  });

  if (error) {
    logger.error({ error, documentId: document.id }, 'Error applying tagging rule to document');
    return { wasTagged: false, hadError: true };
  }

  return { wasTagged: result.appliedTagIds.length > 0, hadError: false };
}

export async function applyTaggingRuleToExistingDocuments({
  taggingRuleId,
  organizationId,
  taggingRulesRepository,
  documentsRepository,
  tagsRepository,
  eventServices,
  logger = createLogger({ namespace: 'tagging-rules' }),
}: {
  taggingRuleId: string;
  organizationId: string;
  taggingRulesRepository: TaggingRulesRepository;
  documentsRepository: DocumentsRepository;
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  logger?: Logger;
}) {
  const { taggingRule } = await taggingRulesRepository.getOrganizationTaggingRule({
    organizationId,
    taggingRuleId,
  });

  if (!taggingRule) {
    throw createError({
      message: 'Tagging rule not found',
      code: 'tagging-rules.not-found',
      statusCode: 404,
    });
  }

  logger.info(
    { organizationId, taggingRuleId },
    'Starting to apply tagging rule to existing documents',
  );

  const documentsIterator = documentsRepository.getAllOrganizationUndeletedDocumentsIterator({
    organizationId,
    batchSize: 100,
  });

  const stats: ProcessingStats = {
    processedCount: 0,
    taggedDocumentsCount: 0,
    errorCount: 0,
  };

  for await (const document of documentsIterator) {
    const result = await processDocumentWithTaggingRule({
      document,
      taggingRule,
      tagsRepository,
      eventServices,
      logger,
    });

    stats.processedCount += 1;
    stats.taggedDocumentsCount += result.wasTagged ? 1 : 0;
    stats.errorCount += result.hadError ? 1 : 0;

    // Log progress every 100 documents
    if (stats.processedCount % 100 === 0) {
      logger.info({ organizationId, taggingRuleId, ...stats }, 'Re-tagging progress update');
    }
  }

  logger.info(
    { organizationId, taggingRuleId, ...stats },
    'Completed applying tagging rule to existing documents',
  );

  return stats;
}
