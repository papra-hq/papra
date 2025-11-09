import type { CONDITION_MATCH_MODES, TAGGING_RULE_FIELDS, TAGGING_RULE_OPERATORS } from './tagging-rules.constants';

export type ConditionMatchMode = (typeof CONDITION_MATCH_MODES)[keyof typeof CONDITION_MATCH_MODES];

export type TaggingRuleForCreation = {
  name: string;
  description: string;
  conditionMatchMode?: ConditionMatchMode;
  conditions: TaggingRuleCondition[];
  tagIds: string[];
};

export type TaggingRuleCondition = {
  field: (typeof TAGGING_RULE_FIELDS)[keyof typeof TAGGING_RULE_FIELDS];
  operator: (typeof TAGGING_RULE_OPERATORS)[keyof typeof TAGGING_RULE_OPERATORS];
  value: string;
};

export type TaggingRule = {
  id: string;
  name: string;
  description: string;
  conditionMatchMode?: ConditionMatchMode;
  conditions: TaggingRuleCondition[];
  actions: { tagId: string }[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};
