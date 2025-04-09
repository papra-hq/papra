import { createError } from '../../shared/errors/errors';
import {
  containsTaggingRuleCondition,
  endsWithTaggingRuleCondition,
  equalTaggingRuleCondition,
  notContainsTaggingRuleCondition,
  notEqualTaggingRuleCondition,
  startsWithTaggingRuleCondition,
} from './tagging-rule-conditions.models';

export const taggingRuleOperatorDefinitions = [
  equalTaggingRuleCondition,
  notEqualTaggingRuleCondition,
  containsTaggingRuleCondition,
  notContainsTaggingRuleCondition,
  startsWithTaggingRuleCondition,
  endsWithTaggingRuleCondition,
];

const taggingRuleOperatorDefinitionsByOperator = Object.fromEntries(taggingRuleOperatorDefinitions.map(taggingRuleOperatorDefinition => [taggingRuleOperatorDefinition.operator, taggingRuleOperatorDefinition]));

export type TaggingRuleOperatorValidatorRegistry = ReturnType<typeof createTaggingRuleOperatorValidatorRegistry>;

export function createTaggingRuleOperatorValidatorRegistry() {
  return {
    getTaggingRuleOperatorValidator,
  };
}

function getTaggingRuleOperatorValidator({ operator }: { operator: string }) {
  const taggingRuleOperatorDefinition = taggingRuleOperatorDefinitionsByOperator[operator];

  if (!taggingRuleOperatorDefinition) {
    throw createError({
      message: `Tagging rule condition for operator ${operator} not found`,
      code: 'tagging_rules.condition_not_found',
      statusCode: 400,
      isInternal: true,
    });
  }

  return taggingRuleOperatorDefinition;
}
