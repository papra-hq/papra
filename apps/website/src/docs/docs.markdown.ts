export function formatDocMarkdown(entry: { body?: string; data: { title: string } }) {
  const {
    body,
    data: { title },
  } = entry;

  // Remove imports and their trailing blank lines without consuming quoted markdown content.
  const bodyWithoutImports =
    body
      ?.replace(
        /^[ \t]*import\s+.*?\s+from\s+(['"])[^\r\n]*?\1;?[ \t]*(?:\r?\n|$)(?:[ \t]*\r?\n)*/gms,
        '',
      )
      .trim() ?? '';

  return `# ${title}\n\n${bodyWithoutImports}`;
}
