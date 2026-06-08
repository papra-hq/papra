import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { RATE_LIMIT_CONFIG_FORMAT_DOC } from '../app/rate-limit/rate-limit.config.constants';
import { rateLimitConfigSchema } from '../app/rate-limit/rate-limit.config.schemas';
import { urlSchema } from '../config/config.schemas';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';

export const documentShareLinksConfig = {
  shareLinkBaseUrl: {
    doc: "The base URL used to generate share links, if not specified it'll use the application `APP_BASE_URL` and the `CLIENT_BASE_URL` as fallback.",
    schema: v.optional(urlSchema),
    env: 'DOCUMENT_SHARE_LINKS_BASE_URL',
    default: undefined,
  },
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
  passwordVerificationRateLimit: {
    doc: `The rate limit applied to share link password verification attempts, to prevent brute-force attacks, globally scoped. ${RATE_LIMIT_CONFIG_FORMAT_DOC}`,
    schema: rateLimitConfigSchema,
    default: '30/1h',
    env: 'DOCUMENT_SHARE_LINKS_PASSWORD_VERIFICATION_RATE_LIMIT',
  },
  documentAccessRateLimit: {
    doc: `The rate limit applied to document access through share links, globally scoped. ${RATE_LIMIT_CONFIG_FORMAT_DOC}`,
    schema: rateLimitConfigSchema,
    default: '3600/1h',
    env: 'DOCUMENT_SHARE_LINKS_DOCUMENT_ACCESS_RATE_LIMIT',
  },
  fileAccessRateLimit: {
    doc: `The rate limit applied to file access through share links, globally scoped. ${RATE_LIMIT_CONFIG_FORMAT_DOC}`,
    schema: rateLimitConfigSchema,
    default: '600/1h',
    env: 'DOCUMENT_SHARE_LINKS_FILE_ACCESS_RATE_LIMIT',
  },
} as const satisfies ConfigDefinition;
