import { createPrefixedIdRegex } from '../shared/random/ids.constants.models';

export const USER_ID_PREFIX = 'usr';
export const USER_ID_REGEX = createPrefixedIdRegex({ prefix: USER_ID_PREFIX });
