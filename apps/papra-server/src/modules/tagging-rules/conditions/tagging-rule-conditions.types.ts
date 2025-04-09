import type { TaggingRuleOperator } from '../tagging-rules.types';

export type TaggingRuleConditionDefinitionValidatorArguments = {
  conditionValue: string;
  fieldValue: string;
  isCaseSensitive: boolean;
};

export type TaggingRuleConditionDefinitionValidator = (args: TaggingRuleConditionDefinitionValidatorArguments) => boolean;

export type TaggingRuleConditionDefinition = {
  operator: TaggingRuleOperator;
  validate: TaggingRuleConditionDefinitionValidator;
};
