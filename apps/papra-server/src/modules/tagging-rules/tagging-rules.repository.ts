import type { Database } from '../app/database/database.types';
import type { DbInsertableTaggingRule, TaggingRuleField, TaggingRuleOperator } from './tagging-rules.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq } from 'drizzle-orm';
import { createError } from '../shared/errors/errors';
import { omitUndefined } from '../shared/utils';
import { aggregateTaggingRules } from './tagging-rules.repository.models';
import { taggingRuleActionsTable, taggingRuleConditionsTable, taggingRulesTable } from './tagging-rules.tables';

export type TaggingRulesRepository = ReturnType<typeof createTaggingRulesRepository>;

export function createTaggingRulesRepository({ db }: { db: Database }) {
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

async function getOrganizationTaggingRules({ organizationId, db }: { organizationId: string; db: Database }) {
  const rawTaggingRules = await db
    .select()
    .from(taggingRulesTable)
    .where(eq(taggingRulesTable.organizationId, organizationId))
    .leftJoin(taggingRuleConditionsTable, eq(taggingRulesTable.id, taggingRuleConditionsTable.taggingRuleId))
    .leftJoin(taggingRuleActionsTable, eq(taggingRulesTable.id, taggingRuleActionsTable.taggingRuleId));

  return aggregateTaggingRules({ rawTaggingRules });
}

async function getOrganizationTaggingRule({ organizationId, taggingRuleId, db }: { organizationId: string; taggingRuleId: string; db: Database }) {
  const rawTaggingRules = await db
    .select()
    .from(taggingRulesTable)
    .where(and(eq(taggingRulesTable.id, taggingRuleId), eq(taggingRulesTable.organizationId, organizationId)))
    .leftJoin(taggingRuleConditionsTable, eq(taggingRulesTable.id, taggingRuleConditionsTable.taggingRuleId))
    .leftJoin(taggingRuleActionsTable, eq(taggingRulesTable.id, taggingRuleActionsTable.taggingRuleId));

  const { taggingRules = [] } = aggregateTaggingRules({ rawTaggingRules });
  const [taggingRule] = taggingRules;

  return {
    taggingRule,
  };
}

async function getOrganizationEnabledTaggingRules({ organizationId, db }: { organizationId: string; db: Database }) {
  const rawTaggingRules = await db
    .select()
    .from(taggingRulesTable)
    .where(and(
      eq(taggingRulesTable.organizationId, organizationId),
      eq(taggingRulesTable.enabled, true),
    ))
    .leftJoin(taggingRuleConditionsTable, eq(taggingRulesTable.id, taggingRuleConditionsTable.taggingRuleId))
    .leftJoin(taggingRuleActionsTable, eq(taggingRulesTable.id, taggingRuleActionsTable.taggingRuleId));

  return aggregateTaggingRules({ rawTaggingRules });
}

async function createTaggingRule({ taggingRule, db }: { taggingRule: DbInsertableTaggingRule; db: Database }) {
  const [createdTaggingRule] = await db.insert(taggingRulesTable).values(taggingRule).returning();

  return { taggingRule: createdTaggingRule };
}

async function deleteOrganizationTaggingRule({ organizationId, taggingRuleId, db }: { organizationId: string; taggingRuleId: string; db: Database }) {
  await db
    .delete(taggingRulesTable)
    .where(and(
      eq(taggingRulesTable.id, taggingRuleId),
      eq(taggingRulesTable.organizationId, organizationId),
    ));
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
    conditions: { field: TaggingRuleField; operator: TaggingRuleOperator; value: string }[];
    tagIds: string[];
  };
  db: Database;
}) {
  const { name, description, enabled, conditions, tagIds } = taggingRule;

  await db.transaction(async (tx) => {
    const [updatedTaggingRule] = await tx
      .update(taggingRulesTable)
      .set(omitUndefined({ name, description, enabled }))
      .where(and(
        eq(taggingRulesTable.id, taggingRuleId),
        eq(taggingRulesTable.organizationId, organizationId),
      ))
      .returning();

    if (!updatedTaggingRule) {
      throw createError({ statusCode: 404, message: 'Tagging rule not found', code: 'tagging-rules.not-found' });
    }

    // Recreate conditions
    await tx.delete(taggingRuleConditionsTable).where(eq(taggingRuleConditionsTable.taggingRuleId, taggingRuleId));
    if (conditions.length > 0) {
      await tx.insert(taggingRuleConditionsTable).values(conditions.map(condition => ({ ...condition, taggingRuleId })));
    }

    // Recreate actions
    await tx.delete(taggingRuleActionsTable).where(eq(taggingRuleActionsTable.taggingRuleId, taggingRuleId));
    await tx.insert(taggingRuleActionsTable).values(tagIds.map(tagId => ({ taggingRuleId, tagId })));
  });
}

async function createTaggingRuleConditions({ taggingRuleId, conditions, db }: { taggingRuleId: string; conditions: {
  field: TaggingRuleField;
  operator: TaggingRuleOperator;
  value: string;
}[]; db: Database; }) {
  await db
    .insert(taggingRuleConditionsTable)
    .values(conditions.map(condition => ({ ...condition, taggingRuleId })));
}

async function createTaggingRuleActions({ taggingRuleId, tagIds, db }: { taggingRuleId: string; tagIds: string[]; db: Database }) {
  await db
    .insert(taggingRuleActionsTable)
    .values(tagIds.map(tagId => ({ taggingRuleId, tagId })));
}
