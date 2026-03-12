import { createPrefixedIdRegex } from '../shared/random/ids';

export const CUSTOM_PROPERTY_DEFINITION_ID_PREFIX = 'cpd';
export const CUSTOM_PROPERTY_DEFINITION_ID_REGEX = createPrefixedIdRegex({ prefix: CUSTOM_PROPERTY_DEFINITION_ID_PREFIX });

export const CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX = 'cpso';
export const CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX = createPrefixedIdRegex({ prefix: CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX });

export const DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX = 'dcpv';
export const DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_REGEX = createPrefixedIdRegex({ prefix: DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX });

export const CUSTOM_PROPERTY_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
} as const;

export const CUSTOM_PROPERTY_TYPES_LIST = Object.values(CUSTOM_PROPERTY_TYPES);

export type CustomPropertyType = typeof CUSTOM_PROPERTY_TYPES[keyof typeof CUSTOM_PROPERTY_TYPES];

export const SELECT_LIKE_PROPERTY_TYPES: CustomPropertyType[] = [
  CUSTOM_PROPERTY_TYPES.SELECT,
  CUSTOM_PROPERTY_TYPES.MULTI_SELECT,
];
