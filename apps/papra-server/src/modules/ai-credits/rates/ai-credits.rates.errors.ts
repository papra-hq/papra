import { createErrorFactory } from '../../shared/errors/errors';

export const createModelCreditRateNotFoundError = createErrorFactory({
  code: 'ai-credits.model-credit-rate-not-found',
  message: 'Model credit rate not found',
  statusCode: 500,
  isInternal: true,
});
