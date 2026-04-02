import { createPrefixedIdRegex } from '../../shared/random/ids';

export const CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX = 'cpso';
export const CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX = createPrefixedIdRegex({ prefix: CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX });
