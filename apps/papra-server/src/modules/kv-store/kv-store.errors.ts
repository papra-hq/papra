import { createErrorFactory } from '../shared/errors/errors';

export const createInvalidKvStoreValueError = createErrorFactory({
  message: 'The provided value is not valid for the key-value store.',
  code: 'kv_store.invalid_value',
  statusCode: 500,
  isInternal: true,
});
