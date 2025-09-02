import { createErrorFactory } from '../../../shared/errors/errors';

export const createDocumentKekRequiredError = createErrorFactory({
  message: 'Document key encryption keys are required',
  code: 'storage_driver.document_key_encryption_keys_required',
  isInternal: true,
  statusCode: 500,
});

export const createUnsupportedEncryptionAlgorithmError = createErrorFactory({
  message: 'Unsupported encryption algorithm',
  code: 'storage_driver.unsupported_encryption_algorithm',
  isInternal: true,
  statusCode: 500,
});

export const createDocumentKekNotFoundError = createErrorFactory({
  message: 'Document key encryption key not found',
  code: 'storage_driver.document_key_encryption_key_not_found',
  isInternal: true,
  statusCode: 500,
});
