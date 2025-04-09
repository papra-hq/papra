import type { TaggingRuleConditionDefinition, TaggingRuleConditionDefinitionValidator, TaggingRuleConditionDefinitionValidatorArguments } from './tagging-rule-conditions.types';
import { TAGGING_RULE_OPERATORS } from '../tagging-rules.constants';
import { defineTaggingRuleCondition } from './tagging-rule-conditions.registry.models';

function negateValidator({ validate }: TaggingRuleConditionDefinition): TaggingRuleConditionDefinitionValidator {
  return (args: TaggingRuleConditionDefinitionValidatorArguments) => !validate(args);
}

export const equalTaggingRuleCondition = defineTaggingRuleCondition({
  operator: TAGGING_RULE_OPERATORS.EQUAL,
  validate: ({ conditionValue, fieldValue, isCaseSensitive }) => {
    if (isCaseSensitive) {
      return conditionValue === fieldValue;
    }

    return conditionValue.toLowerCase() === fieldValue.toLowerCase();
  },
});

export const notEqualTaggingRuleCondition = defineTaggingRuleCondition({
  operator: TAGGING_RULE_OPERATORS.NOT_EQUAL,
  validate: negateValidator(equalTaggingRuleCondition),
});

export const containsTaggingRuleCondition = defineTaggingRuleCondition({
  operator: TAGGING_RULE_OPERATORS.CONTAINS,
  validate: ({ conditionValue, fieldValue, isCaseSensitive }) => {
    if (isCaseSensitive) {
      return fieldValue.includes(conditionValue);
    }

    return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
  },
});

export const notContainsTaggingRuleCondition = defineTaggingRuleCondition({
  operator: TAGGING_RULE_OPERATORS.NOT_CONTAINS,
  validate: negateValidator(containsTaggingRuleCondition),
});

export const startsWithTaggingRuleCondition = defineTaggingRuleCondition({
  operator: TAGGING_RULE_OPERATORS.STARTS_WITH,
  validate: ({ conditionValue, fieldValue, isCaseSensitive }) => {
    if (isCaseSensitive) {
      return fieldValue.startsWith(conditionValue);
    }

    return fieldValue.toLowerCase().startsWith(conditionValue.toLowerCase());
  },
});

export const endsWithTaggingRuleCondition = defineTaggingRuleCondition({
  operator: TAGGING_RULE_OPERATORS.ENDS_WITH,
  validate: ({ conditionValue, fieldValue, isCaseSensitive }) => {
    if (isCaseSensitive) {
      return fieldValue.endsWith(conditionValue);
    }

    return fieldValue.toLowerCase().endsWith(conditionValue.toLowerCase());
  },
});
