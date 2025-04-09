import type { Document } from '../documents/documents.types';
import type { Logger } from '../shared/logger/logger';
import type { TagsRepository } from '../tags/tags.repository';
import type { TaggingRuleOperatorValidatorRegistry } from './conditions/tagging-rule-conditions.registry';
import type { TaggingRulesRepository } from './tagging-rules.repository';
import type { TaggingRuleField, TaggingRuleOperator } from './tagging-rules.types';
import { safely, safelySync } from '@corentinth/chisels';
import { uniq } from 'lodash-es';
import { createLogger } from '../shared/logger/logger';
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
  taggingRuleOperatorValidatorRegistry = createTaggingRuleOperatorValidatorRegistry(),
  logger = createLogger({ namespace: 'tagging-rules' }),
}: {
  document: Document;

  taggingRulesRepository: TaggingRulesRepository;
  taggingRuleOperatorValidatorRegistry?: TaggingRuleOperatorValidatorRegistry;
  tagsRepository: TagsRepository;
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

  const tagIdsToApply: string[] = uniq(taggingRulesToApplyActions.flatMap(taggingRule => taggingRule.actions.map(action => action.tagId)));

  const appliedTagIds = await Promise.all(tagIdsToApply.map(async (tagId) => {
    const [, error] = await safely(() => tagsRepository.addTagToDocument({ tagId, documentId: document.id }));

    if (error) {
      logger.error({ error, tagId, documentId: document.id }, 'Failed to add tag to document');

      return;
    }

    return tagId;
  }));

  logger.info({
    taggingRulesIdsToApply: taggingRulesToApplyActions.map(taggingRule => taggingRule.id),
    appliedTagIds,
    tagIdsToApply,
    hasAllTagBeenApplied: appliedTagIds.length === tagIdsToApply.length,
  }, 'Tagging rules applied');
}
