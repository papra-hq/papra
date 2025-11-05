import type { Expand } from '@corentinth/chisels';
import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import type { BusinessInsertable, CamelCaseKeys, TableWithIdAndTimestamps } from '../app/database/database.columns.types';
import type { ConditionMatchMode } from './tagging-rules.types';

// --- Tagging Rules

export type TaggingRulesTable = TableWithIdAndTimestamps<{
  organization_id: string;
  name: string;
  description: string | null;
  enabled: number;
  condition_match_mode: ColumnType<ConditionMatchMode, ConditionMatchMode | undefined, ConditionMatchMode>;
}>;

export type DbSelectableTaggingRule = Selectable<TaggingRulesTable>;
export type DbInsertableTaggingRule = Insertable<TaggingRulesTable>;
export type DbUpdateableTaggingRule = Updateable<TaggingRulesTable>;

export type InsertableTaggingRule = BusinessInsertable<DbInsertableTaggingRule, {
  enabled?: boolean;
}>;

export type TaggingRule = Expand<CamelCaseKeys<Omit<DbSelectableTaggingRule, 'created_at' | 'updated_at' | 'enabled'> & {
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
}>>;

// --- Tagging Rule Conditions

export type TaggingRuleConditionsTable = TableWithIdAndTimestamps<{
  tagging_rule_id: string;
  field: string;
  operator: string;
  value: string;
  is_case_sensitive: number;
}>;

export type DbSelectableTaggingRuleCondition = Selectable<TaggingRuleConditionsTable>;
export type DbInsertableTaggingRuleCondition = Insertable<TaggingRuleConditionsTable>;
export type DbUpdateableTaggingRuleCondition = Updateable<TaggingRuleConditionsTable>;

export type InsertableTaggingRuleCondition = BusinessInsertable<DbInsertableTaggingRuleCondition, {
  isCaseSensitive?: boolean;
}>;

export type TaggingRuleCondition = Expand<CamelCaseKeys<Omit<DbSelectableTaggingRuleCondition, 'created_at' | 'updated_at' | 'is_case_sensitive'> & {
  createdAt: Date;
  updatedAt: Date;
  isCaseSensitive: boolean;
}>>;

// --- Tagging Rule Actions

export type TaggingRuleActionsTable = TableWithIdAndTimestamps<{
  tagging_rule_id: string;
  tag_id: string;
}>;

export type DbSelectableTaggingRuleAction = Selectable<TaggingRuleActionsTable>;
export type DbInsertableTaggingRuleAction = Insertable<TaggingRuleActionsTable>;
export type DbUpdateableTaggingRuleAction = Updateable<TaggingRuleActionsTable>;

export type InsertableTaggingRuleAction = BusinessInsertable<DbInsertableTaggingRuleAction>;
export type TaggingRuleAction = Expand<CamelCaseKeys<Omit<DbSelectableTaggingRuleAction, 'created_at' | 'updated_at'> & {
  createdAt: Date;
  updatedAt: Date;
}>>;
