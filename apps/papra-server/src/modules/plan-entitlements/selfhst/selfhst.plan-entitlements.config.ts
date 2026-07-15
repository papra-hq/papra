import { booleanishSchema, urlSchema } from '../../config/config.schemas';
import type { AppConfigDefinition } from '../../config/config.types';
import * as v from 'valibot';

export const selfhstEntitlementsConfig = {
  isEnabledForNewClaims: {
    doc: 'Whether the selfhst free plan entitlements is enabled for new claims.',
    schema: booleanishSchema,
    default: true,
    env: 'SELFHST_ENTITLEMENTS_IS_ENABLED_FOR_NEW_CLAIMS',
    showInDocumentation: false,
  },
  entitlementVerification: {
    endpoint: {
      doc: 'The endpoint to verify the selfhst entitlement.',
      schema: v.optional(urlSchema),
      default: undefined,
      env: 'SELFHST_ENTITLEMENTS_VERIFICATION_ENDPOINT',
      showInDocumentation: false,
    },
    token: {
      doc: 'The bearer token to use for the selfhst entitlement verification endpoint.',
      schema: v.optional(v.string()),
      default: undefined,
      env: 'SELFHST_ENTITLEMENTS_VERIFICATION_TOKEN',
      showInDocumentation: false,
    },
  },
} as const satisfies AppConfigDefinition;
