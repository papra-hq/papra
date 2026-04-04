import type { Database } from '../app/database/database.types';
import type { CustomPropertyType } from './custom-properties.constants';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { documentsTable } from '../documents/documents.table';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { createError } from '../shared/errors/errors';
import { omitUndefined } from '../shared/objects';
import { isDefined, isNil } from '../shared/utils';
import { usersTable } from '../users/users.table';
import { createCustomPropertyDefinitionAlreadyExistsError } from './custom-properties.errors';
import { generatePropertyKey } from './custom-properties.repository.models';
import { customPropertyDefinitionsTable, documentCustomPropertyValuesTable } from './custom-properties.table';
import { customPropertySelectOptionsTable } from './options/custom-properties-options.table';

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

      getDocumentCustomPropertyValues,
      getCustomPropertyValuesByDocumentIds,
      setDocumentCustomPropertyValue,
      deleteDocumentCustomPropertyValue,
    },
    { db },
  );
}

async function getOrganizationPropertyDefinitions({ organizationId, db }: { organizationId: string; db: Database }) {
  const definitions = await db
    .select()
    .from(customPropertyDefinitionsTable)
    .where(eq(customPropertyDefinitionsTable.organizationId, organizationId))
    .orderBy(asc(customPropertyDefinitionsTable.displayOrder), asc(customPropertyDefinitionsTable.createdAt));

  const definitionIds = definitions.map(d => d.id);

  const options = definitionIds.length > 0
    ? await db
        .select()
        .from(customPropertySelectOptionsTable)
        .where(inArray(customPropertySelectOptionsTable.propertyDefinitionId, definitionIds))
        .orderBy(asc(customPropertySelectOptionsTable.displayOrder))
    : [];

  const optionsByDefinition = new Map<string, typeof options>();

  for (const option of options) {
    const existing = optionsByDefinition.get(option.propertyDefinitionId) ?? [];
    existing.push(option);
    optionsByDefinition.set(option.propertyDefinitionId, existing);
  }

  return {
    propertyDefinitions: definitions.map(definition => ({
      ...definition,
      options: optionsByDefinition.get(definition.id) ?? [],
    })),
  };
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
    return { definition: undefined };
  }

  const options = await db
    .select()
    .from(customPropertySelectOptionsTable)
    .where(eq(customPropertySelectOptionsTable.propertyDefinitionId, propertyDefinitionId))
    .orderBy(asc(customPropertySelectOptionsTable.displayOrder));

  return {
    definition: {
      ...definition,
      options,
    },
  };
}

async function createPropertyDefinition({ definition, db }: {
  definition: {
    organizationId: string;
    name: string;
    description?: string | null;
    type: CustomPropertyType;
    displayOrder?: number;
  };
  db: Database;
}) {
  const [result, error] = await safely(
    db
      .insert(customPropertyDefinitionsTable)
      .values({
        organizationId: definition.organizationId,
        name: definition.name,
        key: generatePropertyKey({ name: definition.name }),
        description: definition.description,
        type: definition.type,
        displayOrder: definition.displayOrder,
      })
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createCustomPropertyDefinitionAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [created] = result;

  if (isNil(created)) {
    throw createError({
      message: 'Failed to create custom property definition',
      code: 'create_custom_property_definition_failed',
      statusCode: 500,
      isInternal: true,
    });
  }

  return { propertyDefinition: created };
}

async function updatePropertyDefinition({
  propertyDefinitionId,
  organizationId,
  name,
  description,
  displayOrder,
  db,
}: {
  propertyDefinitionId: string;
  organizationId: string;
  name?: string;
  description?: string | null;
  displayOrder?: number;
  db: Database;
}) {
  const [result, error] = await safely(
    db
      .update(customPropertyDefinitionsTable)
      .set(omitUndefined({
        name,
        key: isDefined(name) ? generatePropertyKey({ name }) : undefined,
        description,
        displayOrder,
      }))
      .where(
        and(
          eq(customPropertyDefinitionsTable.id, propertyDefinitionId),
          eq(customPropertyDefinitionsTable.organizationId, organizationId),
        ),
      )
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createCustomPropertyDefinitionAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [propertyDefinition] = result;

  if (isNil(propertyDefinition)) {
    throw createError({
      message: 'Failed to update custom property definition',
      code: 'update_custom_property_definition_failed',
      statusCode: 500,
      isInternal: true,
    });
  }

  return { propertyDefinition };
}

async function deletePropertyDefinition({ propertyDefinitionId, organizationId, db }: { propertyDefinitionId: string; organizationId: string; db: Database }) {
  await db
    .delete(customPropertyDefinitionsTable)
    .where(
      and(
        eq(customPropertyDefinitionsTable.id, propertyDefinitionId),
        eq(customPropertyDefinitionsTable.organizationId, organizationId),
      ),
    );
}

async function getDocumentCustomPropertyValues({ documentId, db }: { documentId: string; db: Database }) {
  const relatedDocAlias = alias(documentsTable, 'related_doc');

  const values = await db
    .select({
      value: {
        id: documentCustomPropertyValuesTable.id,
        propertyDefinitionId: documentCustomPropertyValuesTable.propertyDefinitionId,
        textValue: documentCustomPropertyValuesTable.textValue,
        numberValue: documentCustomPropertyValuesTable.numberValue,
        dateValue: documentCustomPropertyValuesTable.dateValue,
        booleanValue: documentCustomPropertyValuesTable.booleanValue,
        selectOptionId: documentCustomPropertyValuesTable.selectOptionId,
        userId: documentCustomPropertyValuesTable.userId,
        relatedDocumentId: documentCustomPropertyValuesTable.relatedDocumentId,
      },
      definition: {
        id: customPropertyDefinitionsTable.id,
        name: customPropertyDefinitionsTable.name,
        key: customPropertyDefinitionsTable.key,
        type: customPropertyDefinitionsTable.type,
      },
      option: {
        id: customPropertySelectOptionsTable.id,
        name: customPropertySelectOptionsTable.name,
      },
      relatedUser: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      },
      relatedDocument: {
        id: relatedDocAlias.id,
        name: relatedDocAlias.name,
      },
    })
    .from(documentCustomPropertyValuesTable)
    .innerJoin(customPropertyDefinitionsTable, eq(documentCustomPropertyValuesTable.propertyDefinitionId, customPropertyDefinitionsTable.id))
    .leftJoin(customPropertySelectOptionsTable, eq(documentCustomPropertyValuesTable.selectOptionId, customPropertySelectOptionsTable.id))
    .leftJoin(usersTable, eq(documentCustomPropertyValuesTable.userId, usersTable.id))
    .leftJoin(relatedDocAlias, eq(documentCustomPropertyValuesTable.relatedDocumentId, relatedDocAlias.id))
    .where(eq(documentCustomPropertyValuesTable.documentId, documentId));

  return { values };
}

async function getCustomPropertyValuesByDocumentIds({ documentIds, db }: { documentIds: string[]; db: Database }) {
  if (documentIds.length === 0) {
    return { valuesByDocumentId: {} as Record<string, { value: { id: string; propertyDefinitionId: string; textValue: string | null; numberValue: number | null; dateValue: Date | null; booleanValue: boolean | null; selectOptionId: string | null; userId: string | null; relatedDocumentId: string | null }; definition: { id: string; name: string; key: string; type: string }; option: { id: string; name: string } | null; relatedUser: { id: string; name: string | null; email: string } | null; relatedDocument: { id: string; name: string } | null }[]> };
  }

  const relatedDocAlias = alias(documentsTable, 'related_doc');

  const rows = await db
    .select({
      documentId: documentCustomPropertyValuesTable.documentId,
      value: {
        id: documentCustomPropertyValuesTable.id,
        propertyDefinitionId: documentCustomPropertyValuesTable.propertyDefinitionId,
        textValue: documentCustomPropertyValuesTable.textValue,
        numberValue: documentCustomPropertyValuesTable.numberValue,
        dateValue: documentCustomPropertyValuesTable.dateValue,
        booleanValue: documentCustomPropertyValuesTable.booleanValue,
        selectOptionId: documentCustomPropertyValuesTable.selectOptionId,
        userId: documentCustomPropertyValuesTable.userId,
        relatedDocumentId: documentCustomPropertyValuesTable.relatedDocumentId,
      },
      definition: {
        id: customPropertyDefinitionsTable.id,
        name: customPropertyDefinitionsTable.name,
        key: customPropertyDefinitionsTable.key,
        type: customPropertyDefinitionsTable.type,
      },
      option: {
        id: customPropertySelectOptionsTable.id,
        name: customPropertySelectOptionsTable.name,
      },
      relatedUser: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      },
      relatedDocument: {
        id: relatedDocAlias.id,
        name: relatedDocAlias.name,
      },
    })
    .from(documentCustomPropertyValuesTable)
    .innerJoin(customPropertyDefinitionsTable, eq(documentCustomPropertyValuesTable.propertyDefinitionId, customPropertyDefinitionsTable.id))
    .leftJoin(customPropertySelectOptionsTable, eq(documentCustomPropertyValuesTable.selectOptionId, customPropertySelectOptionsTable.id))
    .leftJoin(usersTable, eq(documentCustomPropertyValuesTable.userId, usersTable.id))
    .leftJoin(relatedDocAlias, eq(documentCustomPropertyValuesTable.relatedDocumentId, relatedDocAlias.id))
    .where(inArray(documentCustomPropertyValuesTable.documentId, documentIds));

  const valuesByDocumentId: Record<string, { value: typeof rows[0]['value']; definition: typeof rows[0]['definition']; option: typeof rows[0]['option']; relatedUser: typeof rows[0]['relatedUser']; relatedDocument: typeof rows[0]['relatedDocument'] }[]> = {};

  for (const { documentId, ...rest } of rows) {
    (valuesByDocumentId[documentId] ??= []).push(rest);
  }

  return { valuesByDocumentId };
}

async function setDocumentCustomPropertyValue({ documentId, propertyDefinitionId, values, db }: {
  documentId: string;
  propertyDefinitionId: string;
  values: {
    textValue?: string | null;
    numberValue?: number | null;
    dateValue?: Date | null;
    booleanValue?: boolean | null;
    selectOptionId?: string | null;
    userId?: string | null;
    relatedDocumentId?: string | null;
  }[];
  db: Database;
}) {
  await db
    .delete(documentCustomPropertyValuesTable)
    .where(
      and(
        eq(documentCustomPropertyValuesTable.documentId, documentId),
        eq(documentCustomPropertyValuesTable.propertyDefinitionId, propertyDefinitionId),
      ),
    );

  if (values.length > 0) {
    await db
      .insert(documentCustomPropertyValuesTable)
      .values(values.map(v => ({
        documentId,
        propertyDefinitionId,
        ...v,
      })));
  }
}

async function deleteDocumentCustomPropertyValue({ documentId, propertyDefinitionId, db }: { documentId: string; propertyDefinitionId: string; db: Database }) {
  await db
    .delete(documentCustomPropertyValuesTable)
    .where(
      and(
        eq(documentCustomPropertyValuesTable.documentId, documentId),
        eq(documentCustomPropertyValuesTable.propertyDefinitionId, propertyDefinitionId),
      ),
    );
}
