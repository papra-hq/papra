import type { Database } from '../app/database/database.types';
import type { CustomPropertyType } from './custom-properties.constants';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, count, eq, inArray } from 'drizzle-orm';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/utils';
import { CUSTOM_PROPERTY_TYPES } from './custom-properties.constants';
import { createCustomPropertyDefinitionAlreadyExistsError } from './custom-properties.errors';
import { customPropertyDefinitionsTable, customPropertySelectOptionsTable, documentCustomPropertyValuesTable } from './custom-properties.table';

export type CustomPropertiesRepository = ReturnType<typeof createCustomPropertiesRepository>;

export function createCustomPropertiesRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationPropertyDefinitions,
      getOrganizationPropertyDefinitionsCount,
      getPropertyDefinitionById,
      createPropertyDefinition,
      updatePropertyDefinition,
      deletePropertyDefinition,

      getSelectOptionsByDefinitionId,
      createSelectOptions,
      deleteSelectOptionsByDefinitionId,
      deleteSelectOptionsByIds,
      updateSelectOption,

      getDocumentPropertyValues,
      setDocumentPropertyValue,
      setDocumentMultiSelectPropertyValues,
      deleteDocumentPropertyValue,
      deleteDocumentPropertyValues,
    },
    { db },
  );
}

async function getOrganizationPropertyDefinitions({ organizationId, db }: { organizationId: string; db: Database }) {
  const definitions = await db
    .select()
    .from(customPropertyDefinitionsTable)
    .where(eq(customPropertyDefinitionsTable.organizationId, organizationId))
    .orderBy(customPropertyDefinitionsTable.displayOrder);

  // Fetch options for select-like properties
  const selectDefinitionIds = definitions
    .filter(d => d.type === CUSTOM_PROPERTY_TYPES.SELECT || d.type === CUSTOM_PROPERTY_TYPES.MULTI_SELECT)
    .map(d => d.id);

  let options: (typeof customPropertySelectOptionsTable.$inferSelect)[] = [];
  if (selectDefinitionIds.length > 0) {
    options = await db
      .select()
      .from(customPropertySelectOptionsTable)
      .where(inArray(customPropertySelectOptionsTable.propertyDefinitionId, selectDefinitionIds))
      .orderBy(customPropertySelectOptionsTable.displayOrder);
  }

  const optionsByDefinitionId = new Map<string, (typeof customPropertySelectOptionsTable.$inferSelect)[]>();
  for (const option of options) {
    const existing = optionsByDefinitionId.get(option.propertyDefinitionId) ?? [];
    existing.push(option);
    optionsByDefinitionId.set(option.propertyDefinitionId, existing);
  }

  const propertyDefinitions = definitions.map(definition => ({
    ...definition,
    options: optionsByDefinitionId.get(definition.id) ?? [],
  }));

  return { propertyDefinitions };
}

async function getOrganizationPropertyDefinitionsCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [result] = await db
    .select({ count: count() })
    .from(customPropertyDefinitionsTable)
    .where(eq(customPropertyDefinitionsTable.organizationId, organizationId));

  return { count: result?.count ?? 0 };
}

async function getPropertyDefinitionById({ propertyDefinitionId, organizationId, db }: { propertyDefinitionId: string; organizationId: string; db: Database }) {
  const [definition] = await db
    .select()
    .from(customPropertyDefinitionsTable)
    .where(
      and(
        eq(customPropertyDefinitionsTable.id, propertyDefinitionId),
        eq(customPropertyDefinitionsTable.organizationId, organizationId),
      ),
    );

  if (!definition) {
    return { propertyDefinition: undefined, options: [] };
  }

  const options = await db
    .select()
    .from(customPropertySelectOptionsTable)
    .where(eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId))
    .orderBy(customPropertySelectOptionsTable.displayOrder);

  return {
    propertyDefinition: { ...definition, options },
  };
}

async function createPropertyDefinition({ definition, db }: {
  definition: {
    organizationId: string;
    name: string;
    description?: string | null;
    type: CustomPropertyType;
    color?: string | null;
    isRequired?: boolean;
    displayOrder?: number;
  };
  db: Database;
}) {
  const [result, error] = await safely(
    db
      .insert(customPropertyDefinitionsTable)
      .values(definition)
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createCustomPropertyDefinitionAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [createdDefinition] = result;

  return { propertyDefinition: createdDefinition! };
}

async function updatePropertyDefinition({ propertyDefinitionId, name, description, color, isRequired, displayOrder, db }: {
  propertyDefinitionId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  isRequired?: boolean;
  displayOrder?: number;
  db: Database;
}) {
  const [result, error] = await safely(
    db
      .update(customPropertyDefinitionsTable)
      .set(omitUndefined({
        name,
        description,
        color,
        isRequired,
        displayOrder,
        updatedAt: new Date(),
      }))
      .where(eq(customPropertyDefinitionsTable.id, propertyDefinitionId))
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createCustomPropertyDefinitionAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [updatedDefinition] = result;

  return { propertyDefinition: updatedDefinition! };
}

async function deletePropertyDefinition({ propertyDefinitionId, db }: { propertyDefinitionId: string; db: Database }) {
  await db.delete(customPropertyDefinitionsTable).where(eq(customPropertyDefinitionsTable.id, propertyDefinitionId));
}

// Select options

async function getSelectOptionsByDefinitionId({ propertyDefinitionId, db }: { propertyDefinitionId: string; db: Database }) {
  const options = await db
    .select()
    .from(customPropertySelectOptionsTable)
    .where(eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId))
    .orderBy(customPropertySelectOptionsTable.displayOrder);

  return { options };
}

async function createSelectOptions({ options, db }: {
  options: {
    propertyDefinitionId: string;
    value: string;
    color?: string | null;
    displayOrder?: number;
  }[];
  db: Database;
}) {
  if (options.length === 0) {
    return { options: [] };
  }

  const createdOptions = await db
    .insert(customPropertySelectOptionsTable)
    .values(options)
    .returning();

  return { options: createdOptions };
}

async function deleteSelectOptionsByDefinitionId({ propertyDefinitionId, db }: { propertyDefinitionId: string; db: Database }) {
  await db.delete(customPropertySelectOptionsTable).where(eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId));
}

async function deleteSelectOptionsByIds({ optionIds, db }: { optionIds: string[]; db: Database }) {
  if (optionIds.length === 0) {
    return;
  }

  await db.delete(customPropertySelectOptionsTable).where(inArray(customPropertySelectOptionsTable.id, optionIds));
}

async function updateSelectOption({ optionId, value, color, displayOrder, db }: {
  optionId: string;
  value?: string;
  color?: string | null;
  displayOrder?: number;
  db: Database;
}) {
  const [updatedOption] = await db
    .update(customPropertySelectOptionsTable)
    .set(omitUndefined({
      value,
      color,
      displayOrder,
      updatedAt: new Date(),
    }))
    .where(eq(customPropertySelectOptionsTable.id, optionId))
    .returning();

  return { option: updatedOption };
}

// Document property values

async function getDocumentPropertyValues({ documentId, organizationId, db }: { documentId: string; organizationId: string; db: Database }) {
  const values = await db
    .select({
      value: documentCustomPropertyValuesTable,
      definition: customPropertyDefinitionsTable,
      selectOption: customPropertySelectOptionsTable,
    })
    .from(documentCustomPropertyValuesTable)
    .innerJoin(
      customPropertyDefinitionsTable,
      eq(documentCustomPropertyValuesTable.propertyDefinitionId, customPropertyDefinitionsTable.id),
    )
    .leftJoin(
      customPropertySelectOptionsTable,
      eq(documentCustomPropertyValuesTable.selectOptionId, customPropertySelectOptionsTable.id),
    )
    .where(
      and(
        eq(documentCustomPropertyValuesTable.documentId, documentId),
        eq(customPropertyDefinitionsTable.organizationId, organizationId),
      ),
    );

  return {
    propertyValues: values.map(v => v.value),
    propertyDefinitions: values.map(v => v.definition),
    selectOptions: values.map(v => v.selectOption),
  };
}

async function setDocumentPropertyValue({ documentId, propertyDefinitionId, textValue, numberValue, dateValue, booleanValue, selectOptionId, db }: {
  documentId: string;
  propertyDefinitionId: string;
  textValue?: string | null;
  numberValue?: number | null;
  dateValue?: Date | null;
  booleanValue?: boolean | null;
  selectOptionId?: string | null;
  db: Database;
}) {
  // Delete existing value(s) for this property on this document
  await db.delete(documentCustomPropertyValuesTable).where(
    and(
      eq(documentCustomPropertyValuesTable.documentId, documentId),
      eq(documentCustomPropertyValuesTable.propertyDefinitionId, propertyDefinitionId),
    ),
  );

  // Insert new value
  const [insertedValue] = await db
    .insert(documentCustomPropertyValuesTable)
    .values({
      documentId,
      propertyDefinitionId,
      textValue: textValue ?? null,
      numberValue: numberValue ?? null,
      dateValue: dateValue ?? null,
      booleanValue: booleanValue ?? null,
      selectOptionId: selectOptionId ?? null,
    })
    .returning();

  return { propertyValue: insertedValue };
}

async function setDocumentMultiSelectPropertyValues({ documentId, propertyDefinitionId, selectOptionIds, db }: {
  documentId: string;
  propertyDefinitionId: string;
  selectOptionIds: string[];
  db: Database;
}) {
  // Delete all existing values for this property on this document
  await db.delete(documentCustomPropertyValuesTable).where(
    and(
      eq(documentCustomPropertyValuesTable.documentId, documentId),
      eq(documentCustomPropertyValuesTable.propertyDefinitionId, propertyDefinitionId),
    ),
  );

  if (selectOptionIds.length === 0) {
    return { propertyValues: [] };
  }

  // Insert all selected option IDs
  const insertedValues = await db
    .insert(documentCustomPropertyValuesTable)
    .values(selectOptionIds.map(selectOptionId => ({
      documentId,
      propertyDefinitionId,
      textValue: null,
      numberValue: null,
      dateValue: null,
      booleanValue: null,
      selectOptionId,
    })))
    .returning();

  return { propertyValues: insertedValues };
}

async function deleteDocumentPropertyValue({ documentId, propertyDefinitionId, db }: { documentId: string; propertyDefinitionId: string; db: Database }) {
  await db.delete(documentCustomPropertyValuesTable).where(
    and(
      eq(documentCustomPropertyValuesTable.documentId, documentId),
      eq(documentCustomPropertyValuesTable.propertyDefinitionId, propertyDefinitionId),
    ),
  );
}

async function deleteDocumentPropertyValues({ documentId, db }: { documentId: string; db: Database }) {
  await db.delete(documentCustomPropertyValuesTable).where(eq(documentCustomPropertyValuesTable.documentId, documentId));
}
