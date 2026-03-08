import type { Operator } from '@papra/search-parser';
import type { BinaryOperator } from 'drizzle-orm';
import type { QueryResult } from './query-builder.types';
import { eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { documentsFtsTable } from '../database-fts5.tables';

function joinColumnNames(columns: string[]): string {
  return columns.join(' ');
}

export function formatFts5QueryValue({
  value,
  organizationId,
  matchingColumns = [
    documentsFtsTable.name.name,
    documentsFtsTable.content.name,
  ],
}: {
  value: string;
  organizationId: string;
  matchingColumns?: string[];
}) {
  const formattedValue = value
    .trim()
    .replace(/["'‘’“”]/g, ' '); // Replace various quote characters with space so they don't interfere with FTS5 syntax

  const queryString = [
    `${documentsFtsTable.organizationId.name}:"${organizationId}"`,
    matchingColumns.length === 0
      ? `"${formattedValue}"*`
      : `{${joinColumnNames(matchingColumns)}}:"${formattedValue}"*`,
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

export function createInvalidQueryResult({ message, code}: { message: string; code: string }): QueryResult {
  return {
    sqlQuery: sql`0`,
    issues: [{
      message,
      code,
    }],
  };
}

export function createInvalidDateFormatQueryResult({ field, value }: { field: string; value: string }): QueryResult {
  return createInvalidQueryResult({
    message: `Invalid date format for ${field} filter: "${value}". Expected a valid date string.`,
    code: 'INVALID_DATE_FORMAT',
  });
}

export function createUnsupportedOperatorQueryResult({ operator, field }: { operator: Operator; field: string }): QueryResult {
  return createInvalidQueryResult({
    message: `Unsupported operator "${operator}" for ${field} filter`,
    code: 'UNSUPPORTED_FILTER_OPERATOR',
  });
}
