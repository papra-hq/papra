import { createPrefixedIdRegex } from '../shared/random/ids';

export const CUSTOM_PROPERTY_DEFINITION_ID_PREFIX = 'cpd';
export const CUSTOM_PROPERTY_DEFINITION_ID_REGEX = createPrefixedIdRegex({ prefix: CUSTOM_PROPERTY_DEFINITION_ID_PREFIX });

export const DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX = 'dcpv';
export const DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_REGEX = createPrefixedIdRegex({ prefix: DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX });

export const CUSTOM_PROPERTY_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
  USER_RELATION: 'user_relation',
  DOCUMENT_RELATION: 'document_relation',
} as const;

export const CUSTOM_PROPERTY_TYPES_LIST = Object.values(CUSTOM_PROPERTY_TYPES);

export type CustomPropertyType = typeof CUSTOM_PROPERTY_TYPES[keyof typeof CUSTOM_PROPERTY_TYPES];
