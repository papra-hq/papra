import type { Expand } from '@corentinth/chisels';
import type { TAGGING_RULE_FIELDS, TAGGING_RULE_OPERATORS } from './tagging-rules.constants';
import type { taggingRuleActionsTable, taggingRuleConditionsTable, taggingRulesTable } from './tagging-rules.tables';

export type DbInsertableTaggingRule = typeof taggingRulesTable.$inferInsert;
export type DbInsertableTaggingRuleCondition = typeof taggingRuleConditionsTable.$inferInsert;
export type DbInsertableTaggingRuleAction = typeof taggingRuleActionsTable.$inferInsert;

export type TaggingRuleField = (typeof TAGGING_RULE_FIELDS)[keyof typeof TAGGING_RULE_FIELDS];
export type TaggingRuleOperator = (typeof TAGGING_RULE_OPERATORS)[keyof typeof TAGGING_RULE_OPERATORS];

export type TaggingRule = Expand<typeof taggingRulesTable.$inferSelect>;
export type TaggingRuleCondition = Expand<typeof taggingRuleConditionsTable.$inferSelect>;
export type TaggingRuleAction = Expand<typeof taggingRuleActionsTable.$inferSelect>;
