import type { DbSelectableDocument } from '../documents/documents.types';
import { createPrefixedIdRegex } from '../shared/random/ids';

export const TAGGING_RULE_ID_PREFIX = 'tr';
export const TAGGING_RULE_ID_REGEX = createPrefixedIdRegex({ prefix: TAGGING_RULE_ID_PREFIX });

export const TAGGING_RULE_OPERATORS = {
  EQUAL: 'equal',
  NOT_EQUAL: 'not_equal',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
} as const;

export const TAGGING_RULE_FIELDS = {
  DOCUMENT_NAME: 'name',
  DOCUMENT_CONTENT: 'content',
} as const satisfies Record<string, keyof DbSelectableDocument>;
