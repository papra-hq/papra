import { createPrefixedIdRegex } from '../shared/random/ids';

export const DOCUMENT_VIEW_ID_PREFIX = 'dv';
export const DOCUMENT_VIEW_ID_REGEX = createPrefixedIdRegex({ prefix: DOCUMENT_VIEW_ID_PREFIX });
