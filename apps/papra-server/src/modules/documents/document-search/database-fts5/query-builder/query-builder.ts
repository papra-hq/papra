import type { AndExpression, Expression, FilterExpression, NotExpression, OrExpression, TextExpression } from '@papra/search-parser';
import type { Database } from '../../../../app/database/database.types';
import type { CustomPropertyDefinitionsByKey } from './query-builder.custom-properties';
import type { QueryResult } from './query-builder.types';
import { and, eq, inArray, isNotNull, not, or, sql } from 'drizzle-orm';
import { isValidDate } from '../../../../shared/date';
import { tagIdRegex } from '../../../../tags/tags.constants';
import { normalizeTagName } from '../../../../tags/tags.repository.models';
import { documentsTagsTable, tagsTable } from '../../../../tags/tags.table';
import { documentsTable } from '../../../documents.table';
import { documentsFtsTable } from '../database-fts5.tables';
import { handleCustomPropertyFilter, handleHasCustomPropertyFilter } from './query-builder.custom-properties';
import { getCustomPropertyDefinition } from './query-builder.custom-properties.models';
import {
  createInvalidDateFormatQueryResult,
  createInvalidQueryResult,
  createUnsupportedOperatorQueryResult,
  formatFts5QueryValue,
  getSqlOperator,
} from './query-builder.models';

export function handleEmptyExpression(): QueryResult {
  return {
    sqlQuery: sql`1`,
    issues: [],
  };
}

export function handleNameFilter({ expression, organizationId, db }: { expression: FilterExpression; organizationId: string; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  const { queryString } = formatFts5QueryValue({
    value,
    organizationId,
    matchingColumns: [
      documentsFtsTable.name.name,
    ],
  });

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.selectDistinct({ documentId: documentsFtsTable.documentId }).from(documentsFtsTable).where(eq(documentsFtsTable, queryString)),
    ),
    issues: [],
  };
}

export function handleContentFilter({ expression, organizationId, db }: { expression: FilterExpression; organizationId: string; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  const { queryString } = formatFts5QueryValue({
    value,
    organizationId,
    matchingColumns: [
      documentsFtsTable.content.name,
    ],
  });

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.selectDistinct({ documentId: documentsFtsTable.documentId }).from(documentsFtsTable).where(eq(documentsFtsTable, queryString)),
    ),
    issues: [],
  };
}

export function handleTextExpression({ expression, organizationId, db }: { expression: TextExpression; organizationId: string; db: Database }): QueryResult {
  const { value } = expression;
  const { queryString } = formatFts5QueryValue({
    value,
    organizationId,
    matchingColumns: [
      documentsFtsTable.name.name,
      documentsFtsTable.content.name,
    ],
  });

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.selectDistinct({ documentId: documentsFtsTable.documentId }).from(documentsFtsTable).where(eq(documentsFtsTable, queryString)),
    ),
    issues: [],
  };
}

export function handleAndExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey = {} }: { expression: AndExpression; organizationId: string; db: Database; now: Date; customPropertyDefinitionsByKey?: CustomPropertyDefinitionsByKey }): QueryResult {
  const subQueries = expression.operands.map(expression => buildQueryFromExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey }));

  return {
    sqlQuery: and(...subQueries.map(sq => sq.sqlQuery)),
    issues: subQueries.flatMap(sq => sq.issues),
  };
}

export function handleOrExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey = {} }: { expression: OrExpression; organizationId: string; db: Database; now: Date; customPropertyDefinitionsByKey?: CustomPropertyDefinitionsByKey }): QueryResult {
  const subQueries = expression.operands.map(expression => buildQueryFromExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey }));

  return {
    sqlQuery: or(...subQueries.map(sq => sq.sqlQuery)),
    issues: subQueries.flatMap(sq => sq.issues),
  };
}

export function handleNotExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey = {} }: { expression: NotExpression; organizationId: string; db: Database; now: Date; customPropertyDefinitionsByKey?: CustomPropertyDefinitionsByKey }): QueryResult {
  const subQuery = buildQueryFromExpression({ expression: expression.operand, organizationId, db, now, customPropertyDefinitionsByKey });

  if (!subQuery.sqlQuery) {
    // Should not happen, but just for type safety
    return {
      sqlQuery: sql`0`,
      issues: [
        {
          message: 'NOT operator requires a valid operand',
          code: 'EMPTY_NOT_OPERAND',
        },
        ...subQuery.issues,
      ],
    };
  }

  return {
    sqlQuery: not(subQuery.sqlQuery),
    issues: subQuery.issues,
  };
}

export function handleTagFilter({ expression, organizationId, db }: { expression: FilterExpression; organizationId: string; db: Database }): QueryResult {
  const { value } = expression;

  const query = tagIdRegex.test(value)
    ? eq(tagsTable.id, value)
    : eq(tagsTable.normalizedName, normalizeTagName({ name: value }));

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.selectDistinct({ documentId: documentsTagsTable.documentId })
        .from(documentsTagsTable)
        .innerJoin(tagsTable, eq(documentsTagsTable.tagId, tagsTable.id))
        .where(and(
          // Ensure tag belongs to the same organization + helps performance as there is an index on (organizationId + name)
          eq(tagsTable.organizationId, organizationId),
          query,
        )),
    ),
    issues: [],
  };
}

export function handleHasTagsFilter({ expression, organizationId, db }: { expression: FilterExpression; organizationId: string; db: Database }): QueryResult {
  const { operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.selectDistinct({ documentId: documentsTagsTable.documentId })
        .from(documentsTagsTable)
        .innerJoin(tagsTable, eq(documentsTagsTable.tagId, tagsTable.id))
        .where(eq(tagsTable.organizationId, organizationId)),
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

export function handleDocumentDateFilter({ expression, now }: { expression: FilterExpression; now: Date }): QueryResult {
  const { value, operator, field } = expression;

  const dateValue = getDateValue({ value, now });
  const sqlOperator = getSqlOperator({ operator });

  if (!isValidDate(dateValue)) {
    return createInvalidDateFormatQueryResult({ field, value });
  }

  return {
    sqlQuery: sqlOperator(documentsTable.documentDate, dateValue),
    issues: [],
  };
}

export function handleDocumentHasDateFilter({ expression }: { expression: FilterExpression; organizationId: string; db: Database }): QueryResult {
  const { operator, field } = expression;

  if (operator !== '=') {
    return createUnsupportedOperatorQueryResult({ operator, field });
  }

  return {
    sqlQuery: isNotNull(documentsTable.documentDate),
    issues: [],
  };
}

export function handleCreatedFilter({ expression, now }: { expression: FilterExpression; now: Date }): QueryResult {
  const { value, operator } = expression;

  const dateValue = getDateValue({ value, now });

  if (!isValidDate(dateValue)) {
    return createInvalidDateFormatQueryResult({ field: 'created', value });
  }

  const sqlOperator = getSqlOperator({ operator });

  return {
    sqlQuery: sqlOperator(documentsTable.createdAt, dateValue),
    issues: [],
  };
}

export function handleUnsupportedExpression(): QueryResult {
  return createInvalidQueryResult({
    message: 'Unsupported expression type',
    code: 'UNSUPPORTED_EXPRESSION_TYPE',
  });
}

export function handleInvalidHasValue({ expression }: { expression: FilterExpression }): QueryResult {
  return createInvalidQueryResult({
    message: `Unsupported value "${expression.value}" for has filter`,
    code: 'UNSUPPORTED_HAS_VALUE',
  });
}

export function buildQueryFromExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey = {} }: { expression: Expression; organizationId: string; db: Database; now: Date; customPropertyDefinitionsByKey?: CustomPropertyDefinitionsByKey }): QueryResult {
  // I usually prefer a LUT, but for type narrowing, switch is more convenient and avoids casting
  switch (expression.type) {
    case 'empty': return handleEmptyExpression();
    case 'text': return handleTextExpression({ expression, organizationId, db });
    case 'and': return handleAndExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey });
    case 'or': return handleOrExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey });
    case 'not': return handleNotExpression({ expression, organizationId, db, now, customPropertyDefinitionsByKey });
    case 'filter':
      switch (expression.field) {
        case 'tag': return handleTagFilter({ expression, organizationId, db });
        case 'name': return handleNameFilter({ expression, organizationId, db });
        case 'content': return handleContentFilter({ expression, organizationId, db });
        case 'created': return handleCreatedFilter({ expression, now });
        case 'date': return handleDocumentDateFilter({ expression, now });
        case 'has':
          switch (expression.value) {
            case 'tags': return handleHasTagsFilter({ expression, organizationId, db });
            case 'date': return handleDocumentHasDateFilter({ expression, organizationId, db });
            default: {
              const hasDefinition = getCustomPropertyDefinition({ name: expression.value, customPropertyDefinitionsByKey });

              if (hasDefinition) {
                return handleHasCustomPropertyFilter({ definition: hasDefinition, db });
              }

              return handleInvalidHasValue({ expression });
            }
          }
        default: {
          const definition = getCustomPropertyDefinition({ name: expression.field, customPropertyDefinitionsByKey });

          if (definition) {
            return handleCustomPropertyFilter({ expression, definition, db, now });
          }

          return handleUnsupportedExpression();
        }
      }
    default: return handleUnsupportedExpression();
  }
}
