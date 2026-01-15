import type { Database } from '../../../app/database/database.types';
import { parseSearchQuery } from '@papra/search-parser';
import { and, eq } from 'drizzle-orm';
import { documentsTable } from '../../documents.table';
import { buildQueryFromExpression } from './query-builder/query-builder';

export function makeSearchWhereClause({ query, organizationId, db }: { query: string; organizationId: string; db: Database }) {
  const { expression, issues: parsedIssues } = parseSearchQuery({ query });

  const { sqlQuery, issues } = buildQueryFromExpression({ expression, organizationId, db });

  return {
    searchWhereClause: and(
      eq(documentsTable.organizationId, organizationId),
      eq(documentsTable.isDeleted, false),
      sqlQuery,
    ),
    issues: [...parsedIssues, ...issues],
  };
}
