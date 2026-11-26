export const DEFAULT_TAGGING_RELEVANCE_INSTRUCTION =
  '- Suggest tags that are relevant to the document content.';
export const DEFAULT_TAGGING_DUPLICATES_INSTRUCTION =
  '- Do not suggest new tags that are too similar to existing tags.';
export const DEFAULT_TAGGING_PROMPT = [
  DEFAULT_TAGGING_RELEVANCE_INSTRUCTION,
  DEFAULT_TAGGING_DUPLICATES_INSTRUCTION,
].join('\n');
