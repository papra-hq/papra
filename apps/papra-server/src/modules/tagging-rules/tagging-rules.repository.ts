import type { DatabaseClient } from '../app/database/database.types';
import type { ConditionMatchMode, TaggingRuleField, TaggingRuleOperator } from './tagging-rules.types';
import { injectArguments } from '@corentinth/chisels';
import { createError } from '../shared/errors/errors';
import { omitUndefined } from '../shared/utils';
import { dbToTag } from '../tags/tags.models';
import { aggregateTaggingRules } from './tagging-rules.repository.models';
import { dbToTaggingRule, dbToTaggingRuleAction, dbToTaggingRuleCondition, taggingRuleActionToDb, taggingRuleConditionToDb, taggingRuleToDb } from './tagging-rules.models';
import type { DbInsertableTaggingRule } from './tagging-rules.new.tables';

export type TaggingRulesRepository = ReturnType<typeof createTaggingRulesRepository>;

export function createTaggingRulesRepository({ db }: { db: DatabaseClient }) {
  return injectArguments(
    {
      getOrganizationTaggingRules,
      getOrganizationEnabledTaggingRules,
      getOrganizationTaggingRule,
      createTaggingRule,
      deleteOrganizationTaggingRule,
      updateOrganizationTaggingRule,
      createTaggingRuleConditions,
      createTaggingRuleActions,
    },
    { db },
  );
}

async function getOrganizationTaggingRules({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const records = await db
    .selectFrom('tagging_rules')
    .where('tagging_rules.organization_id', '=', organizationId)
    .leftJoin('tagging_rule_conditions', 'tagging_rules.id', 'tagging_rule_conditions.tagging_rule_id')
    .leftJoin('tagging_rule_actions', 'tagging_rules.id', 'tagging_rule_actions.tagging_rule_id')
    .leftJoin('tags', 'tagging_rule_actions.tag_id', 'tags.id')
    .select([
      'tagging_rules.id as tr_id',
      'tagging_rules.organization_id as tr_organization_id',
      'tagging_rules.name as tr_name',
      'tagging_rules.description as tr_description',
      'tagging_rules.enabled as tr_enabled',
      'tagging_rules.condition_match_mode as tr_condition_match_mode',
      'tagging_rules.created_at as tr_created_at',
      'tagging_rules.updated_at as tr_updated_at',
      'tagging_rule_conditions.id as trc_id',
      'tagging_rule_conditions.tagging_rule_id as trc_tagging_rule_id',
      'tagging_rule_conditions.field as trc_field',
      'tagging_rule_conditions.operator as trc_operator',
      'tagging_rule_conditions.value as trc_value',
      'tagging_rule_conditions.is_case_sensitive as trc_is_case_sensitive',
      'tagging_rule_conditions.created_at as trc_created_at',
      'tagging_rule_conditions.updated_at as trc_updated_at',
      'tagging_rule_actions.id as tra_id',
      'tagging_rule_actions.tagging_rule_id as tra_tagging_rule_id',
      'tagging_rule_actions.tag_id as tra_tag_id',
      'tagging_rule_actions.created_at as tra_created_at',
      'tagging_rule_actions.updated_at as tra_updated_at',
      'tags.id as tag_id',
      'tags.organization_id as tag_organization_id',
      'tags.name as tag_name',
      'tags.color as tag_color',
      'tags.description as tag_description',
      'tags.created_at as tag_created_at',
      'tags.updated_at as tag_updated_at',
    ])
    .execute();

  const rawTaggingRules = records.map(record => ({
    tagging_rules: dbToTaggingRule({
      id: record.tr_id,
      organization_id: record.tr_organization_id,
      name: record.tr_name,
      description: record.tr_description,
      enabled: record.tr_enabled,
      condition_match_mode: record.tr_condition_match_mode,
      created_at: record.tr_created_at,
      updated_at: record.tr_updated_at,
    })!,
    tagging_rule_conditions: record.trc_id ? dbToTaggingRuleCondition({
      id: record.trc_id,
      tagging_rule_id: record.trc_tagging_rule_id!,
      field: record.trc_field!,
      operator: record.trc_operator!,
      value: record.trc_value!,
      is_case_sensitive: record.trc_is_case_sensitive!,
      created_at: record.trc_created_at!,
      updated_at: record.trc_updated_at!,
    }) ?? null : null,
    tagging_rule_actions: record.tra_id ? dbToTaggingRuleAction({
      id: record.tra_id,
      tagging_rule_id: record.tra_tagging_rule_id!,
      tag_id: record.tra_tag_id!,
      created_at: record.tra_created_at!,
      updated_at: record.tra_updated_at!,
    }) ?? null : null,
    tags: record.tag_id ? dbToTag({
      id: record.tag_id,
      organization_id: record.tag_organization_id!,
      name: record.tag_name!,
      color: record.tag_color!,
      description: record.tag_description!,
      created_at: record.tag_created_at!,
      updated_at: record.tag_updated_at!,
    }) ?? null : null,
  }));

  return aggregateTaggingRules({ rawTaggingRules });
}

async function getOrganizationTaggingRule({ organizationId, taggingRuleId, db }: { organizationId: string; taggingRuleId: string; db: DatabaseClient }) {
  const records = await db
    .selectFrom('tagging_rules')
    .where('tagging_rules.id', '=', taggingRuleId)
    .where('tagging_rules.organization_id', '=', organizationId)
    .leftJoin('tagging_rule_conditions', 'tagging_rules.id', 'tagging_rule_conditions.tagging_rule_id')
    .leftJoin('tagging_rule_actions', 'tagging_rules.id', 'tagging_rule_actions.tagging_rule_id')
    .leftJoin('tags', 'tagging_rule_actions.tag_id', 'tags.id')
    .select([
      'tagging_rules.id as tr_id',
      'tagging_rules.organization_id as tr_organization_id',
      'tagging_rules.name as tr_name',
      'tagging_rules.description as tr_description',
      'tagging_rules.enabled as tr_enabled',
      'tagging_rules.condition_match_mode as tr_condition_match_mode',
      'tagging_rules.created_at as tr_created_at',
      'tagging_rules.updated_at as tr_updated_at',
      'tagging_rule_conditions.id as trc_id',
      'tagging_rule_conditions.tagging_rule_id as trc_tagging_rule_id',
      'tagging_rule_conditions.field as trc_field',
      'tagging_rule_conditions.operator as trc_operator',
      'tagging_rule_conditions.value as trc_value',
      'tagging_rule_conditions.is_case_sensitive as trc_is_case_sensitive',
      'tagging_rule_conditions.created_at as trc_created_at',
      'tagging_rule_conditions.updated_at as trc_updated_at',
      'tagging_rule_actions.id as tra_id',
      'tagging_rule_actions.tagging_rule_id as tra_tagging_rule_id',
      'tagging_rule_actions.tag_id as tra_tag_id',
      'tagging_rule_actions.created_at as tra_created_at',
      'tagging_rule_actions.updated_at as tra_updated_at',
      'tags.id as tag_id',
      'tags.organization_id as tag_organization_id',
      'tags.name as tag_name',
      'tags.color as tag_color',
      'tags.description as tag_description',
      'tags.created_at as tag_created_at',
      'tags.updated_at as tag_updated_at',
    ])
    .execute();

  const rawTaggingRules = records.map(record => ({
    tagging_rules: dbToTaggingRule({
      id: record.tr_id,
      organization_id: record.tr_organization_id,
      name: record.tr_name,
      description: record.tr_description,
      enabled: record.tr_enabled,
      condition_match_mode: record.tr_condition_match_mode,
      created_at: record.tr_created_at,
      updated_at: record.tr_updated_at,
    })!,
    tagging_rule_conditions: record.trc_id ? dbToTaggingRuleCondition({
      id: record.trc_id,
      tagging_rule_id: record.trc_tagging_rule_id!,
      field: record.trc_field!,
      operator: record.trc_operator!,
      value: record.trc_value!,
      is_case_sensitive: record.trc_is_case_sensitive!,
      created_at: record.trc_created_at!,
      updated_at: record.trc_updated_at!,
    }) ?? null : null,
    tagging_rule_actions: record.tra_id ? dbToTaggingRuleAction({
      id: record.tra_id,
      tagging_rule_id: record.tra_tagging_rule_id!,
      tag_id: record.tra_tag_id!,
      created_at: record.tra_created_at!,
      updated_at: record.tra_updated_at!,
    }) ?? null : null,
    tags: record.tag_id ? dbToTag({
      id: record.tag_id,
      organization_id: record.tag_organization_id!,
      name: record.tag_name!,
      color: record.tag_color!,
      description: record.tag_description!,
      created_at: record.tag_created_at!,
      updated_at: record.tag_updated_at!,
    }) ?? null : null,
  }));

  const { taggingRules = [] } = aggregateTaggingRules({ rawTaggingRules });
  const [taggingRule] = taggingRules;

  return {
    taggingRule,
  };
}

async function getOrganizationEnabledTaggingRules({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const records = await db
    .selectFrom('tagging_rules')
    .where('tagging_rules.organization_id', '=', organizationId)
    .where('tagging_rules.enabled', '=', 1)
    .leftJoin('tagging_rule_conditions', 'tagging_rules.id', 'tagging_rule_conditions.tagging_rule_id')
    .leftJoin('tagging_rule_actions', 'tagging_rules.id', 'tagging_rule_actions.tagging_rule_id')
    .leftJoin('tags', 'tagging_rule_actions.tag_id', 'tags.id')
    .select([
      'tagging_rules.id as tr_id',
      'tagging_rules.organization_id as tr_organization_id',
      'tagging_rules.name as tr_name',
      'tagging_rules.description as tr_description',
      'tagging_rules.enabled as tr_enabled',
      'tagging_rules.condition_match_mode as tr_condition_match_mode',
      'tagging_rules.created_at as tr_created_at',
      'tagging_rules.updated_at as tr_updated_at',
      'tagging_rule_conditions.id as trc_id',
      'tagging_rule_conditions.tagging_rule_id as trc_tagging_rule_id',
      'tagging_rule_conditions.field as trc_field',
      'tagging_rule_conditions.operator as trc_operator',
      'tagging_rule_conditions.value as trc_value',
      'tagging_rule_conditions.is_case_sensitive as trc_is_case_sensitive',
      'tagging_rule_conditions.created_at as trc_created_at',
      'tagging_rule_conditions.updated_at as trc_updated_at',
      'tagging_rule_actions.id as tra_id',
      'tagging_rule_actions.tagging_rule_id as tra_tagging_rule_id',
      'tagging_rule_actions.tag_id as tra_tag_id',
      'tagging_rule_actions.created_at as tra_created_at',
      'tagging_rule_actions.updated_at as tra_updated_at',
      'tags.id as tag_id',
      'tags.organization_id as tag_organization_id',
      'tags.name as tag_name',
      'tags.color as tag_color',
      'tags.description as tag_description',
      'tags.created_at as tag_created_at',
      'tags.updated_at as tag_updated_at',
    ])
    .execute();

  const rawTaggingRules = records.map(record => ({
    tagging_rules: dbToTaggingRule({
      id: record.tr_id,
      organization_id: record.tr_organization_id,
      name: record.tr_name,
      description: record.tr_description,
      enabled: record.tr_enabled,
      condition_match_mode: record.tr_condition_match_mode,
      created_at: record.tr_created_at,
      updated_at: record.tr_updated_at,
    })!,
    tagging_rule_conditions: record.trc_id ? dbToTaggingRuleCondition({
      id: record.trc_id,
      tagging_rule_id: record.trc_tagging_rule_id!,
      field: record.trc_field!,
      operator: record.trc_operator!,
      value: record.trc_value!,
      is_case_sensitive: record.trc_is_case_sensitive!,
      created_at: record.trc_created_at!,
      updated_at: record.trc_updated_at!,
    }) ?? null : null,
    tagging_rule_actions: record.tra_id ? dbToTaggingRuleAction({
      id: record.tra_id,
      tagging_rule_id: record.tra_tagging_rule_id!,
      tag_id: record.tra_tag_id!,
      created_at: record.tra_created_at!,
      updated_at: record.tra_updated_at!,
    }) ?? null : null,
    tags: record.tag_id ? dbToTag({
      id: record.tag_id,
      organization_id: record.tag_organization_id!,
      name: record.tag_name!,
      color: record.tag_color!,
      description: record.tag_description!,
      created_at: record.tag_created_at!,
      updated_at: record.tag_updated_at!,
    }) ?? null : null,
  }));

  return aggregateTaggingRules({ rawTaggingRules });
}

async function createTaggingRule({ taggingRule, db }: { taggingRule: DbInsertableTaggingRule; db: DatabaseClient }) {
  const dbCreatedTaggingRule = await db
    .insertInto('tagging_rules')
    .values(taggingRule)
    .returningAll()
    .executeTakeFirst();

  if (!dbCreatedTaggingRule) {
    // Very unlikely to happen as the query will throw an error if the tagging rule is not created
    // it's for type safety
    throw new Error('Failed to create tagging rule');
  }

  const createdTaggingRule = dbToTaggingRule(dbCreatedTaggingRule);

  if (!createdTaggingRule) {
    throw new Error('Failed to transform created tagging rule');
  }

  return { taggingRule: createdTaggingRule };
}

async function deleteOrganizationTaggingRule({ organizationId, taggingRuleId, db }: { organizationId: string; taggingRuleId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('tagging_rules')
    .where('id', '=', taggingRuleId)
    .where('organization_id', '=', organizationId)
    .execute();
}

async function updateOrganizationTaggingRule({
  organizationId,
  taggingRuleId,
  taggingRule,
  db,
}: {
  organizationId: string;
  taggingRuleId: string;
  taggingRule: {
    name: string;
    description: string | undefined;
    enabled: boolean | undefined;
    conditionMatchMode: ConditionMatchMode | undefined;
    conditions: { field: TaggingRuleField; operator: TaggingRuleOperator; value: string }[];
    tagIds: string[];
  };
  db: DatabaseClient;
}) {
  const { name, description, enabled, conditionMatchMode, conditions, tagIds } = taggingRule;

  await db.transaction().execute(async (tx) => {
    const updates: { name?: string; description?: string | null; enabled?: number; condition_match_mode?: ConditionMatchMode; updated_at?: number } = {};

    if (name !== undefined) {
      updates.name = name;
    }
    if (description !== undefined) {
      updates.description = description;
    }
    if (enabled !== undefined) {
      updates.enabled = enabled ? 1 : 0;
    }
    if (conditionMatchMode !== undefined) {
      updates.condition_match_mode = conditionMatchMode;
    }
    updates.updated_at = Date.now();

    const updatedTaggingRule = await tx
      .updateTable('tagging_rules')
      .set(omitUndefined(updates))
      .where('id', '=', taggingRuleId)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedTaggingRule) {
      throw createError({ statusCode: 404, message: 'Tagging rule not found', code: 'tagging-rules.not-found' });
    }

    // Recreate conditions
    await tx.deleteFrom('tagging_rule_conditions').where('tagging_rule_id', '=', taggingRuleId).execute();
    if (conditions.length > 0) {
      await tx
        .insertInto('tagging_rule_conditions')
        .values(conditions.map(condition => taggingRuleConditionToDb({ ...condition, taggingRuleId })))
        .execute();
    }

    // Recreate actions
    await tx.deleteFrom('tagging_rule_actions').where('tagging_rule_id', '=', taggingRuleId).execute();
    if (tagIds.length > 0) {
      const actionsToInsert = tagIds.map(tagId => taggingRuleActionToDb({ taggingRuleId, tagId })) as any;
      await tx
        .insertInto('tagging_rule_actions')
        .values(actionsToInsert)
        .execute();
    }
  });
}

async function createTaggingRuleConditions({ taggingRuleId, conditions, db }: { taggingRuleId: string; conditions: {
  field: TaggingRuleField;
  operator: TaggingRuleOperator;
  value: string;
}[]; db: DatabaseClient; }) {
  await db
    .insertInto('tagging_rule_conditions')
    .values(conditions.map(condition => taggingRuleConditionToDb({ ...condition, taggingRuleId })))
    .execute();
}

async function createTaggingRuleActions({ taggingRuleId, tagIds, db }: { taggingRuleId: string; tagIds: string[]; db: DatabaseClient }) {
  if (tagIds.length === 0) {
    return;
  }

  const actionsToInsert = tagIds.map(tagId => taggingRuleActionToDb({ taggingRuleId, tagId })) as any;
  await db
    .insertInto('tagging_rule_actions')
    .values(actionsToInsert)
    .execute();
}
