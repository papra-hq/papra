import { rateLimitConfigSchema } from '../app/rate-limit/rate-limit.config.schemas';
import type { AppConfigDefinition } from '../config/config.types';
import { selfhstEntitlementsConfig } from './selfhst/selfhst.plan-entitlements.config';

export const planEntitlementsConfig = {
  selfhst: selfhstEntitlementsConfig,
  claimRateLimit: {
    doc: 'The per-user rate limit for claiming plan entitlements',
    schema: rateLimitConfigSchema,
    default: '5/1h',
    env: 'PLAN_ENTITLEMENTS_CLAIM_RATE_LIMIT',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
