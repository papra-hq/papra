import { createErrorFactory } from '../shared/errors/errors';

export const createPlanNotFoundError = createErrorFactory({
  code: 'plans.plan_not_found',
  message: 'Plan not found',
  statusCode: 404,
});
