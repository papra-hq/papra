import { createErrorFactory } from '../shared/errors/errors';

export const createPlanNotFoundError = createErrorFactory({
  code: 'plans.plan_not_found',
  message: 'Plan not found',
  statusCode: 404,
});

export const createOrganizationPlanPriceIdNotSetError = createErrorFactory({
  code: 'plans.organization_plan_price_id_not_set',
  message: 'Organization plan price ID is not set',
  statusCode: 500,
  isInternal: true,
});
