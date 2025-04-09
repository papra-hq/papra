import type { TaggingRule, TaggingRuleAction, TaggingRuleCondition } from './tagging-rules.types';

export function aggregateTaggingRules({
  rawTaggingRules,
}: {
  rawTaggingRules: {
    tagging_rules: TaggingRule;
    tagging_rule_conditions: TaggingRuleCondition | null;
    tagging_rule_actions: TaggingRuleAction | null;
  }[];
}) {
  const taggingRulesRecord = rawTaggingRules.reduce((acc, rawTaggingRule) => {
    const { id: taggingRuleId } = rawTaggingRule.tagging_rules;

    if (!acc[taggingRuleId]) {
      acc[taggingRuleId] = {
        ...rawTaggingRule.tagging_rules,
        conditions: {},
        actions: {},
      };
    }

    if (rawTaggingRule.tagging_rule_conditions) {
      acc[taggingRuleId].conditions[rawTaggingRule.tagging_rule_conditions.id] = rawTaggingRule.tagging_rule_conditions;
    }

    if (rawTaggingRule.tagging_rule_actions) {
      acc[taggingRuleId].actions[rawTaggingRule.tagging_rule_actions.id] = rawTaggingRule.tagging_rule_actions;
    }

    return acc;
  }, {} as Record<string, TaggingRule & { conditions: Record<string, TaggingRuleCondition>; actions: Record<string, TaggingRuleAction> }>);

  return {
    taggingRules: Object
      .values(taggingRulesRecord)
      .map(taggingRule => ({
        ...taggingRule,
        conditions: Object.values(taggingRule.conditions),
        actions: Object.values(taggingRule.actions),
      })),
  };
}
