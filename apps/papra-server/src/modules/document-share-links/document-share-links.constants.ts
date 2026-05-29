import { createPrefixedIdRegex } from '../shared/random/ids';

export const SHARE_LINK_ID_PREFIX = 'dsl';
export const SHARE_LINK_ID_REGEX = createPrefixedIdRegex({ prefix: SHARE_LINK_ID_PREFIX });

export const SHARE_LINK_TOKEN_LENGTH = 64;
export const SHARE_LINK_TOKEN_REGEX = new RegExp(`^[a-z0-9]{${SHARE_LINK_TOKEN_LENGTH}}$`, 'i');
