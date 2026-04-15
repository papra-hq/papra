import { createPrefixedIdRegex } from '../shared/random/ids';

export const WEBHOOK_ID_PREFIX = 'wbh';
export const WEBHOOK_ID_REGEX = createPrefixedIdRegex({ prefix: WEBHOOK_ID_PREFIX });

export const WEBHOOK_URL_ALLOWED_HOSTNAMES_ENV_VAR = 'WEBHOOK_URL_ALLOWED_HOSTNAMES';
