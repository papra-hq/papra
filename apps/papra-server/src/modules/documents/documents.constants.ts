import { createPrefixedIdRegex } from '../shared/random/ids';

export const DOCUMENT_ID_PREFIX = 'doc';
export const DOCUMENT_ID_REGEX = createPrefixedIdRegex({ prefix: DOCUMENT_ID_PREFIX });

export const ORIGINAL_DOCUMENTS_STORAGE_KEY = 'originals';
