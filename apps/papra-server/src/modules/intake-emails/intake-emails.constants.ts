import { createPrefixedIdRegex } from '../shared/random/ids';

export const INTAKE_EMAIL_ID_PREFIX = 'ie';
export const INTAKE_EMAIL_ID_REGEX = createPrefixedIdRegex({ prefix: INTAKE_EMAIL_ID_PREFIX });

// Mutualized since it's used in route definition and owlrelay client
export const INTAKE_EMAILS_INGEST_ROUTE = '/api/intake-emails/ingest' as const;
