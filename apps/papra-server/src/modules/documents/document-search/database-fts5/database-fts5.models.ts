export function buildFts5ColumnMatchTerm({
  columnNames,
  value,
  isExactMatch,
}: {
  columnNames: string[];
  value: string;
  isExactMatch: boolean;
}): string {
  const sanitizedValue = value.trim().replace(/["'‘’“”]/g, ' '); // Replace various quote characters with space so they don't interfere with FTS5 syntax
  const quotedValue = `"${sanitizedValue}"`;
  const formattedValue = isExactMatch ? quotedValue : `${quotedValue}*`;

  if (columnNames.length === 0) {
    return formattedValue;
  }

  if (columnNames.length === 1) {
    return `${columnNames[0]}:${formattedValue}`;
  }

  return `{${columnNames.join(' ')}}:${formattedValue}`;
}
