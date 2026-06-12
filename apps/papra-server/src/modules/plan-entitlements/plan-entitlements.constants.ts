import { createPrefixedIdRegex } from '../shared/random/ids.constants.models';

export const planEntitlementIdPrefix = 'pla_ent';
export const planEntitlementIdRegex = createPrefixedIdRegex({ prefix: planEntitlementIdPrefix });

export const PLAN_ENTITLEMENT_SOURCES = {
  ADMIN: 'admin',
  USER_CLAIM: 'user-claim',
} as const;

export type PlanEntitlementSource =
  (typeof PLAN_ENTITLEMENT_SOURCES)[keyof typeof PLAN_ENTITLEMENT_SOURCES];
