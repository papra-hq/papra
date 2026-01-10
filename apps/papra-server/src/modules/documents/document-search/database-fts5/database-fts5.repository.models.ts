import { documentsFtsTable } from './database-fts5.tables';

export function formatFts5SearchQuery({ searchQuery }: { searchQuery: string }) {
  const formattedSearchQuery = searchQuery
    .trim()
    .replace(/[^\p{L}\p{N}\s\-_]/gu, '') // Remove special characters except hyphens and underscores, preserve Unicode letters/numbers
    .replace(/\b(?:AND|OR|NOT)\b/gi, ' ') // Remove boolean operators
    .split(/\s+/)
    .filter(token => token.length > 0)
    .map(token => `"${token}"*`)
    .join(' ');

  return { formattedSearchQuery };
}

export function createFts5DocumentSearchQuery({
  searchQuery,
  organizationId,
  organizationIdColumnName = documentsFtsTable.organizationId.name,
}: {
  searchQuery: string;
  organizationId: string;
  organizationIdColumnName?: string;
}) {
  const { formattedSearchQuery } = formatFts5SearchQuery({ searchQuery });

  const query = `${organizationIdColumnName}:"${organizationId}" ${formattedSearchQuery}`;

  return { query };
}
