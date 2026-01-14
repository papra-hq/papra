import type { AndExpression, Expression, FilterExpression, NotExpression, OrExpression, TextExpression } from '@papra/search-parser';
import type { Database } from '../../../../app/database/database.types';
import type { QueryResult } from './query-builder.types';
import { and, eq, inArray, not, or, sql } from 'drizzle-orm';
import { documentsTagsTable, tagsTable } from '../../../../tags/tags.table';
import { documentsTable } from '../../../documents.table';
import { documentsFtsTable } from '../database-fts5.tables';
import { createUnsupportedOperatorIssue, formatFts5QueryValue } from './query-builder.models';

export function handleEmptyExpression(): QueryResult {
  return {
    sqlQuery: sql`1`,
    issues: [],
  };
}

export function handleNameFilter({ expression, organizationId, db }: { expression: FilterExpression; organizationId: string; db: Database }): QueryResult {
  const { value, operator, field } = expression;

  if (operator !== '=') {
    return {
      sqlQuery: sql`0`,
      issues: [createUnsupportedOperatorIssue({ operator, field })],
    };
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
    return {
      sqlQuery: sql`0`,
      issues: [createUnsupportedOperatorIssue({ operator, field })],
    };
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

export function handleAndExpression({ expression, organizationId, db }: { expression: AndExpression; organizationId: string; db: Database }): QueryResult {
  const subQueries = expression.operands.map(expression => buildQueryFromExpression({ expression, organizationId, db }));

  return {
    sqlQuery: and(...subQueries.map(sq => sq.sqlQuery)),
    issues: subQueries.flatMap(sq => sq.issues),
  };
}

export function handleOrExpression({ expression, organizationId, db }: { expression: OrExpression; organizationId: string; db: Database }): QueryResult {
  const subQueries = expression.operands.map(expression => buildQueryFromExpression({ expression, organizationId, db }));

  return {
    sqlQuery: or(...subQueries.map(sq => sq.sqlQuery)),
    issues: subQueries.flatMap(sq => sq.issues),
  };
}

export function handleNotExpression({ expression, organizationId, db }: { expression: NotExpression; organizationId: string; db: Database }): QueryResult {
  const subQuery = buildQueryFromExpression({ expression: expression.operand, organizationId, db });

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

  return {
    sqlQuery: inArray(
      documentsTable.id,
      db.selectDistinct({ documentId: documentsTagsTable.documentId })
        .from(documentsTagsTable)
        .innerJoin(tagsTable, eq(documentsTagsTable.tagId, tagsTable.id))
        .where(and(
          // Ensure tag belongs to the same organization + helps performance as there is an index on (organizationId + name)
          eq(tagsTable.organizationId, organizationId),
          or(
            eq(tagsTable.name, value),
            eq(tagsTable.id, value),
          ),
        )),
    ),
    issues: [],
  };
}

export function handleUnsupportedExpression(): QueryResult {
  return {
    sqlQuery: sql`0`,
    issues: [
      {
        message: 'Unsupported expression type',
        code: 'UNSUPPORTED_EXPRESSION_TYPE',
      },
    ],
  };
}

export function buildQueryFromExpression({ expression, organizationId, db }: { expression: Expression; organizationId: string; db: Database }): QueryResult {
  // I usually prefer a LUT, but for type narrowing, switch is more convenient and avoids casting
  switch (expression.type) {
    case 'empty': return handleEmptyExpression();
    case 'text': return handleTextExpression({ expression, organizationId, db });
    case 'and': return handleAndExpression({ expression, organizationId, db });
    case 'or': return handleOrExpression({ expression, organizationId, db });
    case 'not': return handleNotExpression({ expression, organizationId, db });
    case 'filter':
      switch (expression.field) {
        case 'tag': return handleTagFilter({ expression, organizationId, db });
        case 'name': return handleNameFilter({ expression, organizationId, db });
        case 'content': return handleContentFilter({ expression, organizationId, db });
        default: return handleUnsupportedExpression();
      }
    default: return handleUnsupportedExpression();
  }
}
