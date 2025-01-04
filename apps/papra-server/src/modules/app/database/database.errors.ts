import { createErrorFactory } from '../../shared/errors/errors';

export const createCannotParseJsonError = createErrorFactory({
  message: 'Cannot parse JSON',
  code: 'db.json_parse_error',
  statusCode: 500,
});
