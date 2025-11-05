import type { Document } from '../documents/documents.types';
import type {
  DbInsertableTaggingRule,
  DbInsertableTaggingRuleAction,
  DbInsertableTaggingRuleCondition,
  DbSelectableTaggingRule,
  DbSelectableTaggingRuleAction,
  DbSelectableTaggingRuleCondition,
  InsertableTaggingRule,
  InsertableTaggingRuleAction,
  InsertableTaggingRuleCondition,
  TaggingRule,
  TaggingRuleAction,
  TaggingRuleCondition,
} from './tagging-rules.new.tables';
import { get } from 'lodash-es';
import { generateId } from '../shared/random/ids';
import { TAGGING_RULE_ID_PREFIX } from './tagging-rules.constants';

const generateTaggingRuleId = () => generateId({ prefix: TAGGING_RULE_ID_PREFIX });
const generateTaggingRuleConditionId = () => generateId({ prefix: 'trc' });
const generateTaggingRuleActionId = () => generateId({ prefix: 'tra' });

export function getDocumentFieldValue({ document, field }: { document: Document; field: string }) {
  const fieldValue: unknown = get(document, field);

  return { fieldValue: String(fieldValue ?? '') };
}

// DB <-> Business model transformers

// Tagging Rule transformers

export function dbToTaggingRule(dbRule?: DbSelectableTaggingRule): TaggingRule | undefined {
  if (!dbRule) {
    return undefined;
  }

  return {
    id: dbRule.id,
    organizationId: dbRule.organization_id,
    name: dbRule.name,
    description: dbRule.description,
    enabled: dbRule.enabled === 1,
    conditionMatchMode: dbRule.condition_match_mode,
    createdAt: new Date(dbRule.created_at),
    updatedAt: new Date(dbRule.updated_at),
  };
}

export function taggingRuleToDb(
  rule: InsertableTaggingRule,
  {
    now = new Date(),
    generateId = generateTaggingRuleId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableTaggingRule {
  return {
    id: rule.id ?? generateId(),
    organization_id: rule.organizationId,
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled === true ? 1 : 0,
    condition_match_mode: rule.conditionMatchMode,
    created_at: rule.createdAt?.getTime() ?? now.getTime(),
    updated_at: rule.updatedAt?.getTime() ?? now.getTime(),
  };
}

// Tagging Rule Condition transformers

export function dbToTaggingRuleCondition(dbCondition?: DbSelectableTaggingRuleCondition): TaggingRuleCondition | undefined {
  if (!dbCondition) {
    return undefined;
  }

  return {
    id: dbCondition.id,
    taggingRuleId: dbCondition.tagging_rule_id,
    field: dbCondition.field,
    operator: dbCondition.operator,
    value: dbCondition.value,
    isCaseSensitive: dbCondition.is_case_sensitive === 1,
    createdAt: new Date(dbCondition.created_at),
    updatedAt: new Date(dbCondition.updated_at),
  };
}

export function taggingRuleConditionToDb(
  condition: InsertableTaggingRuleCondition,
  {
    now = new Date(),
    generateId = generateTaggingRuleConditionId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableTaggingRuleCondition {
  return {
    id: condition.id ?? generateId(),
    tagging_rule_id: condition.taggingRuleId,
    field: condition.field,
    operator: condition.operator,
    value: condition.value,
    is_case_sensitive: condition.isCaseSensitive === true ? 1 : 0,
    created_at: condition.createdAt?.getTime() ?? now.getTime(),
    updated_at: condition.updatedAt?.getTime() ?? now.getTime(),
  };
}

// Tagging Rule Action transformers

export function dbToTaggingRuleAction(dbAction?: DbSelectableTaggingRuleAction): TaggingRuleAction | undefined {
  if (!dbAction) {
    return undefined;
  }

  return {
    id: dbAction.id,
    taggingRuleId: dbAction.tagging_rule_id,
    tagId: dbAction.tag_id,
    createdAt: new Date(dbAction.created_at),
    updatedAt: new Date(dbAction.updated_at),
  };
}

export function taggingRuleActionToDb(
  action: InsertableTaggingRuleAction,
  {
    now = new Date(),
    generateId = generateTaggingRuleActionId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableTaggingRuleAction {
  return {
    id: action.id ?? generateId(),
    tagging_rule_id: action.taggingRuleId ?? '',
    tag_id: action.tagId ?? '',
    created_at: action.createdAt?.getTime() ?? now.getTime(),
    updated_at: action.updatedAt?.getTime() ?? now.getTime(),
  };
}
