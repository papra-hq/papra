import type { TAGGING_RULE_FIELDS, TAGGING_RULE_OPERATORS } from './tagging-rules.constants';

export type TaggingRuleForCreation = {
  name: string;
  description: string;
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
  conditions: TaggingRuleCondition[];
  actions: { tagId: string }[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};
