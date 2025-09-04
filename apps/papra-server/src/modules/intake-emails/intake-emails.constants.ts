import { createPrefixedIdRegex } from '../shared/random/ids';

export const INTAKE_EMAIL_ID_PREFIX = 'ie';
export const INTAKE_EMAIL_ID_REGEX = createPrefixedIdRegex({ prefix: INTAKE_EMAIL_ID_PREFIX });

// Mutualized since it's used in route definition and owlrelay client
export const INTAKE_EMAILS_INGEST_ROUTE = '/api/intake-emails/ingest' as const;

// Copied from https://github.com/colinhacks/zod/blob/main/packages/zod/src/v4/core/regexes.ts#L42 while waiting to migrate to zod v4
// eslint-disable-next-line regexp/no-useless-escape, regexp/prefer-d, regexp/strict, regexp/use-ignore-case
export const RFC_5322_EMAIL_ADDRESS_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
