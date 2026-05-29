import type { ConfigDefinition } from 'figue';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';

export const documentShareLinksConfig = {
  maxLinksPerDocument: {
    doc: 'The maximum number of share links a single document can have at the same time.',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 10,
    env: 'DOCUMENT_SHARE_LINKS_MAX_LINKS_PER_DOCUMENT',
  },
  accessTokenTtlMinutes: {
    doc: 'The lifetime, in minutes, of the access token issued after a successful share-link password verification.',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 15,
    env: 'DOCUMENT_SHARE_LINKS_ACCESS_TOKEN_TTL_MINUTES',
  },
  passwordVerifyMaxAttempts: {
    doc: 'The maximum number of password verification attempts allowed per share link within the rate-limit window.',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 5,
    env: 'DOCUMENT_SHARE_LINKS_PASSWORD_VERIFY_MAX_ATTEMPTS',
  },
  passwordVerifyWindowMinutes: {
    doc: 'The rate-limit window, in minutes, for share-link password verification attempts.',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 30,
    env: 'DOCUMENT_SHARE_LINKS_PASSWORD_VERIFY_WINDOW_MINUTES',
  },
  fileAccessMaxRequestsPerMinute: {
    doc: 'The maximum number of file downloads allowed per share link per minute, to prevent abuse of the share system as a file host.',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 30,
    env: 'DOCUMENT_SHARE_LINKS_FILE_ACCESS_MAX_REQUESTS_PER_MINUTE',
  },
} as const satisfies ConfigDefinition;
