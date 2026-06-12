import { createErrorFactory } from '../shared/errors/errors';

export const createPlanEntitlementAlreadyExistsError = createErrorFactory({
  message: 'User already has an entitlement of this type',
  code: 'plan_entitlements.already_exists',
  statusCode: 409,
});

export const createPlanEntitlementNotFoundError = createErrorFactory({
  message: 'Plan entitlement not found',
  code: 'plan_entitlements.not_found',
  statusCode: 404,
});

export const createPlanEntitlementUnknownTypeError = createErrorFactory({
  message: 'Unknown plan entitlement type',
  code: 'plan_entitlements.unknown_type',
  statusCode: 400,
});

export const createPlanEntitlementNotEligibleError = createErrorFactory({
  message: 'User is not eligible for this entitlement',
  code: 'plan_entitlements.not_eligible',
  statusCode: 400,
});
