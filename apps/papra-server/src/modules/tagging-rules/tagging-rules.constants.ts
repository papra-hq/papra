import type { DbSelectableDocument } from '../documents/documents.types';

export const taggingRuleIdPrefix = 'tr';
export const taggingRuleIdRegex = new RegExp(`^${taggingRuleIdPrefix}_[a-z0-9]{24}$`);

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
