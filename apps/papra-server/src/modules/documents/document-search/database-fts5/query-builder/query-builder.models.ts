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

export function createUnsupportedOperatorIssue({ operator, field }: { operator: string; field: string }) {
  return {
    message: `Unsupported operator "${operator}" for ${field} filter`,
    code: 'UNSUPPORTED_FILTER_OPERATOR',
  };
}
