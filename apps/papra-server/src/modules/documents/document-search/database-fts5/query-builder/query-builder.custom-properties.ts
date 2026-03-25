import type { FilterExpression } from '@papra/search-parser';
import type { Database } from '../../../../app/database/database.types';
import type { customPropertyDefinitionsTable } from '../../../../custom-properties/custom-properties.table';
import type { QueryResult } from './query-builder.types';
import { and, eq, inArray, isNotNull, or } from 'drizzle-orm';
import { generatePropertyKey } from '../../../../custom-properties/custom-properties.repository.models';
import { documentCustomPropertyValuesTable } from '../../../../custom-properties/custom-properties.table';
import { customPropertySelectOptionsTable } from '../../../../custom-properties/options/custom-properties-options.table';
import { isValidDate } from '../../../../shared/date';
import { usersTable } from '../../../../users/users.table';
import { documentsTable } from '../../../documents.table';
import { createInvalidDateFormatQueryResult, createInvalidQueryResult, createUnsupportedOperatorQueryResult, getSqlOperator } from './query-builder.models';

export type CustomPropertyDefinition = typeof customPropertyDefinitionsTable.$inferSelect;
export type CustomPropertyDefinitionsByKey = Record<string, CustomPropertyDefinition>;

const BOOLEAN_TRUE_VALUES = new Set(['true', 'yes', 'y', '1', 'on', 'enabled']);
const BOOLEAN_FALSE_VALUES = new Set(['false', 'no', 'n', '0', 'off', 'disabled']);

function parseBooleanValue({ value }: { value: string }): boolean | null {
  const lower = value.toLowerCase();

  if (BOOLEAN_TRUE_VALUES.has(lower)) {
    return true;
  }

  if (BOOLEAN_FALSE_VALUES.has(lower)) {
    return false;
  }

  return null;
}

function handleBooleanPropertyFilter({ expression, definition, db }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  const parsed = parseBooleanValue({ value });

  if (parsed === null) {
    return createInvalidQueryResult({
      message: `Invalid boolean value "${value}" for ${field} filter. Expected one of: true, yes, y, 1, on, enabled, false, no, n, 0, off, disabled`,
      code: 'INVALID_BOOLEAN_VALUE',
    });
  }

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          eq(documentCustomPropertyValuesTable.booleanValue, parsed),
        )),
    ),
    issues: [],
  };
}

function handleTextPropertyFilter({ expression, definition, db }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          eq(documentCustomPropertyValuesTable.textValue, value),
        )),
    ),
    issues: [],
  };
}

function handleNumberPropertyFilter({ expression, definition, db }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const { value, field } = expression;

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return createInvalidQueryResult({
      message: `Invalid number value "${value}" for ${field} filter. Expected a numeric value.`,
      code: 'INVALID_NUMBER_VALUE',
    });
  }

  const sqlOperator = getSqlOperator({ operator: expression.operator });

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          sqlOperator(documentCustomPropertyValuesTable.numberValue, parsed),
        )),
    ),
    issues: [],
  };
}

function getDateValue({ value, now }: { value: string; now: Date }): Date {
  if (value === 'now') {
    return now;
  }

  return new Date(value);
}

function handleDatePropertyFilter({ expression, definition, db, now }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database; now: Date }): QueryResult {
  const { value, field } = expression;

  const dateValue = getDateValue({ value, now });

  if (!isValidDate(dateValue)) {
    return createInvalidDateFormatQueryResult({ field, value });
  }

  const sqlOperator = getSqlOperator({ operator: expression.operator });

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          sqlOperator(documentCustomPropertyValuesTable.dateValue, dateValue),
        )),
    ),
    issues: [],
  };
}

function handleSelectPropertyFilter({ expression, definition, db }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .innerJoin(
          customPropertySelectOptionsTable,
          eq(documentCustomPropertyValuesTable.selectOptionId, customPropertySelectOptionsTable.id),
        )
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          eq(customPropertySelectOptionsTable.key, generatePropertyKey({ name: value })),
        )),
    ),
    issues: [],
  };
}

function handleUserRelationPropertyFilter({ expression, definition, db }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .leftJoin(usersTable, eq(documentCustomPropertyValuesTable.userId, usersTable.id))
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          or(
            eq(documentCustomPropertyValuesTable.userId, value),
            eq(usersTable.email, value),
            eq(usersTable.name, value),
          ),
        )),
    ),
    issues: [],
  };
}

function handleDocumentRelationPropertyFilter({ expression, definition, db }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          eq(documentCustomPropertyValuesTable.relatedDocumentId, value),
        )),
    ),
    issues: [],
  };
}

export function handleHasCustomPropertyFilter({ definition, db }: { definition: CustomPropertyDefinition; db: Database }): QueryResult {
  const fieldByTypes = {
    boolean: documentCustomPropertyValuesTable.booleanValue,
    text: documentCustomPropertyValuesTable.textValue,
    number: documentCustomPropertyValuesTable.numberValue,
    date: documentCustomPropertyValuesTable.dateValue,
    select: documentCustomPropertyValuesTable.selectOptionId,
    multi_select: documentCustomPropertyValuesTable.selectOptionId,
    user_relation: documentCustomPropertyValuesTable.userId,
    document_relation: documentCustomPropertyValuesTable.relatedDocumentId,
  };

  const field = fieldByTypes[definition.type];

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.select({ id: documentCustomPropertyValuesTable.documentId })
        .from(documentCustomPropertyValuesTable)
        .where(and(
          eq(documentCustomPropertyValuesTable.propertyDefinitionId, definition.id),
          isNotNull(field),
        )),
    ),
    issues: [],
  };
}

export function handleCustomPropertyFilter({ expression, definition, db, now }: { expression: FilterExpression; definition: CustomPropertyDefinition; db: Database; now: Date }): QueryResult {
  switch (definition.type) {
    case 'boolean': return handleBooleanPropertyFilter({ expression, definition, db });
    case 'text': return handleTextPropertyFilter({ expression, definition, db });
    case 'number': return handleNumberPropertyFilter({ expression, definition, db });
    case 'date': return handleDatePropertyFilter({ expression, definition, db, now });
    case 'select': return handleSelectPropertyFilter({ expression, definition, db });
    case 'multi_select': return handleSelectPropertyFilter({ expression, definition, db });
    case 'user_relation': return handleUserRelationPropertyFilter({ expression, definition, db });
    case 'document_relation': return handleDocumentRelationPropertyFilter({ expression, definition, db });
    default:
      return createInvalidQueryResult({
        message: `Unsupported custom property type for filter`,
        code: 'UNSUPPORTED_CUSTOM_PROPERTY_TYPE',
      });
  }
}
