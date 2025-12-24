import { createPrefixedIdRegex } from '../shared/random/ids';

export const USER_ID_PREFIX = 'usr';
export const USER_ID_REGEX = createPrefixedIdRegex({ prefix: USER_ID_PREFIX });
