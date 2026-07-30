import * as v from 'valibot';

export function buildAutoNamingSystemPrompt({ maxTitleLength }: { maxTitleLength: number }) {
  return [
    'You are an assistant that generates a concise, descriptive title for a document based on its content.',
    '',
    'Instructions:',
    '- Produce a short, human-readable title (3-10 words) that clearly identifies the document.',
    '- Include key identifiers when present: document type (invoice, contract, receipt, letter), issuer or company name, and date or period.',
    '- Examples: "Invoice - Acme Corp - March 2026", "Employment Contract - Jane Doe", "Electricity Bill - Q1 2026".',
    `- The title must not exceed ${maxTitleLength} characters.`,
    '- Do not include a file extension, surrounding quotes, or trailing punctuation.',
    '- Write the title in the same language as the document content.',
    '- If the current document name already looks meaningful and descriptive, you may refine it rather than replace it.',
  ].join('\n');
}

export function buildAutoNamingUserPrompt({
  document,
}: {
  document: { content: string; name: string };
}) {
  return [`Current document name: ${document.name}`, 'Document content:', document.content].join(
    '\n',
  );
}

export type AutoNamingResponse = {
  title: string;
};

export function buildAutoNamingSchema(): v.GenericSchema<AutoNamingResponse> {
  return v.object({
    title: v.string(),
  });
}

export function getTitleAction({
  autoNamingResponse,
  currentName,
  maxTitleLength,
}: {
  autoNamingResponse: AutoNamingResponse;
  currentName: string;
  maxTitleLength: number;
}) {
  const title = autoNamingResponse.title
    .replace(/[\n\r]+/g, ' ')
    .replace(/["'.]+$/g, '')
    .trim()
    .slice(0, maxTitleLength);

  const shouldRename = title.length > 0 && title !== currentName;

  return { shouldRename, title };
}
