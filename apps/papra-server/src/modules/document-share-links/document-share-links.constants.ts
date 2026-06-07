import { createPrefixedIdRegex } from '../shared/random/ids.constants.models';

export const SHARE_LINK_ID_PREFIX = 'dsl';
export const SHARE_LINK_ID_REGEX = createPrefixedIdRegex({ prefix: SHARE_LINK_ID_PREFIX });

export const SHARE_LINK_TOKEN_LENGTH = 64;
export const SHARE_LINK_TOKEN_REGEX = new RegExp(`^[a-z0-9]{${SHARE_LINK_TOKEN_LENGTH}}$`, 'i');

export const SHARE_LINK_LAST_ACCESSED_TOUCH_DELAY_SECONDS = 60;
