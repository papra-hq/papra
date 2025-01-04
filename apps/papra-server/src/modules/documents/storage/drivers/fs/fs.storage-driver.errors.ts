import { createErrorFactory } from '../../../../shared/errors/errors';

export const createFileAlreadyExistsError = createErrorFactory({
  message: 'The file already exists.',
  code: 'document.file_already_exists',
  statusCode: 409,
});
