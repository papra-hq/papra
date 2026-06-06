import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { SHARE_LINK_ID_REGEX, SHARE_LINK_TOKEN_REGEX } from './document-share-links.constants';

export const shareLinkIdSchema = createRegexSchema(SHARE_LINK_ID_REGEX);
export const shareLinkTokenSchema = createRegexSchema(SHARE_LINK_TOKEN_REGEX);

const shareLinkPasswordSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(256));

export const createShareLinkBodySchema = v.strictObject({
  expiresAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp(), v.toDate()))),
  password: v.optional(shareLinkPasswordSchema),
});

export const updateShareLinkBodySchema = v.pipe(
  v.strictObject({
    expiresAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp(), v.toDate()))),
    password: v.optional(v.nullable(shareLinkPasswordSchema)),
    isEnabled: v.optional(v.boolean()),
  }),
  v.check(
    data => data.expiresAt !== undefined || data.password !== undefined || data.isEnabled !== undefined,
    'At least one of \'expiresAt\', \'password\', or \'isEnabled\' must be provided',
  ),
);

export const verifySharePasswordBodySchema = v.strictObject({
  password: shareLinkPasswordSchema,
});
