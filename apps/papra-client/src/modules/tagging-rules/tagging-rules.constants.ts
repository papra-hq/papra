import type { LocaleKeys } from '../i18n/locales.types';

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
} as const;

export const TAGGING_RULE_OPERATORS_LOCALIZATION_KEYS: Record<(typeof TAGGING_RULE_OPERATORS)[keyof typeof TAGGING_RULE_OPERATORS], LocaleKeys> = {
  [TAGGING_RULE_OPERATORS.EQUAL]: 'tagging-rules.operator.equals',
  [TAGGING_RULE_OPERATORS.NOT_EQUAL]: 'tagging-rules.operator.not-equals',
  [TAGGING_RULE_OPERATORS.CONTAINS]: 'tagging-rules.operator.contains',
  [TAGGING_RULE_OPERATORS.NOT_CONTAINS]: 'tagging-rules.operator.not-contains',
  [TAGGING_RULE_OPERATORS.STARTS_WITH]: 'tagging-rules.operator.starts-with',
  [TAGGING_RULE_OPERATORS.ENDS_WITH]: 'tagging-rules.operator.ends-with',
} as const;

export const TAGGING_RULE_FIELDS_LOCALIZATION_KEYS: Record<(typeof TAGGING_RULE_FIELDS)[keyof typeof TAGGING_RULE_FIELDS], LocaleKeys> = {
  [TAGGING_RULE_FIELDS.DOCUMENT_NAME]: 'tagging-rules.field.name',
  [TAGGING_RULE_FIELDS.DOCUMENT_CONTENT]: 'tagging-rules.field.content',
} as const;
