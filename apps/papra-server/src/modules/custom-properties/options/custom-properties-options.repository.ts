import type { BatchItem } from 'drizzle-orm/batch';
import type { Database } from '../../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, inArray } from 'drizzle-orm';
import { generatePropertyKey } from '../custom-properties.repository.models';
import { createCustomPropertySelectOptionUnknownIdError } from './custom-properties-options.errors';
import { customPropertySelectOptionsTable } from './custom-properties-options.table';

export type CustomPropertiesOptionsRepository = ReturnType<typeof createCustomPropertiesOptionsRepository>;

export function createCustomPropertiesOptionsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getSelectOption,
      getSelectOptions,
      syncSelectOptions,
    },
    { db },
  );
}

async function getSelectOption({ optionId, propertyDefinitionId, db}: { optionId: string; propertyDefinitionId: string; db: Database }) {
  const [option] = await db
    .select()
    .from(customPropertySelectOptionsTable)
    .where(
      and(
        eq(customPropertySelectOptionsTable.id, optionId),
        eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId),
      ),
    );

  return {
    option,
  };
}

async function getSelectOptions({ optionsIds, propertyDefinitionId, db}: { optionsIds: string[]; propertyDefinitionId: string; db: Database }) {
  const options = await db
    .select()
    .from(customPropertySelectOptionsTable)
    .where(
      and(
        inArray(customPropertySelectOptionsTable.id, optionsIds),
        eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId),
      ),
    );

  return {
    options,
  };
}

async function syncSelectOptions({ propertyDefinitionId, options, db }: {
  propertyDefinitionId: string;
  options: { id?: string; name: string }[];
  db: Database;
}) {
  const existingOptions = await db
    .select({ id: customPropertySelectOptionsTable.id })
    .from(customPropertySelectOptionsTable)
    .where(eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId));

  const existingOptionIds = new Set(existingOptions.map(o => o.id));

  const optionsWithPositions = options.map((option, index) => ({ ...option, displayOrder: index }));

  const optionsToUpdate = optionsWithPositions.filter((option): option is { id: string; name: string; displayOrder: number } => option.id !== undefined);
  const optionsToCreate = optionsWithPositions.filter(option => option.id === undefined);

  const hasUnknownIds = optionsToUpdate.some(option => !existingOptionIds.has(option.id));

  if (hasUnknownIds) {
    throw createCustomPropertySelectOptionUnknownIdError();
  }

  const providedIds = new Set(optionsToUpdate.map(option => option.id));
  const optionsIdsToDelete = existingOptions.filter(existing => !providedIds.has(existing.id)).map(o => o.id);

  const hasUpdates = optionsToUpdate.length > 0;
  const hasCreates = optionsToCreate.length > 0;
  const hasDeletes = optionsIdsToDelete.length > 0;

  if (!hasUpdates && !hasCreates && !hasDeletes) {
    return;
  }

  await db.batch([
    ...optionsToUpdate.map(option =>
      db
        .update(customPropertySelectOptionsTable)
        .set({
          name: option.name,
          key: generatePropertyKey({ name: option.name }),
          displayOrder: option.displayOrder,
        })
        .where(
          and(
            eq(customPropertySelectOptionsTable.id, option.id),
            eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId),
          ),
        ) as BatchItem<'sqlite'>,
    ),
    ...(hasCreates
      ? [
          db
            .insert(customPropertySelectOptionsTable)
            .values(optionsToCreate.map(option => ({
              propertyDefinitionId,
              name: option.name,
              key: generatePropertyKey({ name: option.name }),
              displayOrder: option.displayOrder,
            }))),
        ]
      : []),
    ...(hasDeletes
      ? [
          db
            .delete(customPropertySelectOptionsTable)
            .where(
              and(
                inArray(customPropertySelectOptionsTable.id, optionsIdsToDelete),
                eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId),
              ),
            ),
        ]
      : []),
  ] as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
}
