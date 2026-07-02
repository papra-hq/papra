import type { Operator } from '@papra/search-parser';
import type { BinaryOperator } from 'drizzle-orm';
import type { QueryResult } from './query-builder.types';
import { eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { documentsFtsTable } from '../database-fts5.tables';
import { buildFts5ColumnMatchTerm } from '../database-fts5.models';

export function formatFts5QueryValue({
  value,
  organizationId,
  matchingColumns = [documentsFtsTable.name.name, documentsFtsTable.content.name],
}: {
  value: string;
  organizationId: string;
  matchingColumns?: string[];
}) {
  const queryString = [
    buildFts5ColumnMatchTerm({
      columnNames: [documentsFtsTable.organizationId.name],
      value: organizationId,
      isExactMatch: true,
    }),
    buildFts5ColumnMatchTerm({
      columnNames: matchingColumns,
      value,
      isExactMatch: false,
    }),
  ].join(' ');

  return { queryString };
}

const operatorsMap: Record<Operator, BinaryOperator> = {
  '=': eq,
  '<': lt,
  '<=': lte,
  '>': gt,
  '>=': gte,
};

export function getSqlOperator({ operator }: { operator: Operator }): BinaryOperator {
  return operatorsMap[operator];
}

export function createInvalidQueryResult({
  message,
  code,
}: {
  message: string;
  code: string;
}): QueryResult {
  return {
    sqlQuery: sql`0`,
    issues: [
      {
        message,
        code,
      },
    ],
  };
}

export function createInvalidDateFormatQueryResult({
  field,
  value,
}: {
  field: string;
  value: string;
}): QueryResult {
  return createInvalidQueryResult({
    message: `Invalid date format for ${field} filter: "${value}". Expected a valid date string.`,
    code: 'INVALID_DATE_FORMAT',
  });
}

export function createUnsupportedOperatorQueryResult({
  operator,
  field,
}: {
  operator: Operator;
  field: string;
}): QueryResult {
  return createInvalidQueryResult({
    message: `Unsupported operator "${operator}" for ${field} filter`,
    code: 'UNSUPPORTED_FILTER_OPERATOR',
  });
}
